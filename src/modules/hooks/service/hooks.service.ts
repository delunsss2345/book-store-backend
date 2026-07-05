import { HooksMessage } from '@/common';
import { SePayHooksDto } from '@/modules/hooks/dto/request/sepay-hooks.dto';
import { OrderService } from '@/modules/order/service/order.service';
import { PaymentIntentService } from '@/modules/payment/service/payment-intent.service';
import { PaymentService } from '@/modules/payment/service/payment.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { HooksRepository } from '../repository/hooks.repository';

type WebhookOrderRef = {
  id: number;
  userId: number | null;
};

@Injectable()
export class HooksService {
  constructor(
    private readonly hooksRepository: HooksRepository,
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
    private readonly paymentIntent: PaymentIntentService,
    private readonly transactionService: TransactionService,
  ) { }

  private async savePaymentTransaction(
    body: SePayHooksDto,
    status: PaymentStatus,
    order: WebhookOrderRef | null,
  ) {
    return await this.paymentService.createWebhookSepayTransaction({
      amount: Number(body.transferAmount),
      orderId: order?.id ?? null,
      userId: order?.userId ?? null,
      status,
    });
  }

  private handlePaymentIntentExpired = async (
    content: string,
    webHookId: number,
    attempts: number,
    orderCode: string,
  ) => {
    Logger.debug('Payment intent is expired for transfer content', content);
    await Promise.all([
      this.paymentIntent.markPaymentIntent(orderCode, PaymentStatus.EXPIRED),
      this.hooksRepository.updateWebhookStatus(
        webHookId,
        JobStatus.FAILED,
        attempts,
      ),
    ]);

    return {
      success: false,
      content,
      webhookInboxId: webHookId.toString(),
      orderCode,
      message: HooksMessage.PAYMENT_INTENT_EXPIRED,
    };
  };

  private handlePaymentIntentNotFoundByContent = async (
    content: string,
    webHookId: number,
    attempts: number,
  ) => {
    Logger.debug('Payment intent is not found for transfer content', content);
    await this.hooksRepository.updateWebhookStatus(
      webHookId,
      JobStatus.FAILED,
      attempts,
    );

    return {
      success: false,
      content,
      webhookInboxId: webHookId.toString(),
      message: HooksMessage.PAYMENT_INTENT_NOT_FOUND,
    };
  };

  private handleAlreadyProcessedPaymentIntent = async (
    content: string,
    orderCode: string,
    webHookId: number,
    attempts: number,
    idempotencyKey: number,
  ) => {
    Logger.debug('Payment intent already marked as success, skipping', content);
    await Promise.all([
      this.paymentIntent.markPaymentIntent(orderCode, PaymentStatus.SUCCESS),
      this.hooksRepository.updateWebhookStatus(
        webHookId,
        JobStatus.DONE,
        attempts,
      ),
    ]);
    return {
      success: true,
      idempotencyKey,
      content,
      webhookInboxId: webHookId.toString(),
      message: HooksMessage.PAYMENT_INTENT_ALREADY_SUCCESS,
    };
  };

  private handleSepayWebhookWithoutContent = async (
    body: SePayHooksDto,
    webHookId: number,
    attempts: number,
    idempotencyKey: number,
  ) => {
    await this.savePaymentTransaction(
      body,
      PaymentStatus.NOT_FOUND_ORDER_CODE,
      null,
    );

    const doneWebhook = await this.hooksRepository.updateWebhookStatus(
      webHookId,
      JobStatus.DONE,
      attempts,
    );

    return {
      success: true,
      ignored: true,
      webhookInboxId: doneWebhook.id.toString(),
      message: HooksMessage.WEBHOOK_MISSING_TRANSFER_CONTENT,
    };
  };

  private handleSepayWebhookMarkDone = async (
    orderId: number,
    webHookId: number,
    attempts: number,
    orderCode: string,
  ) => {
    const [paidOrder, doneWebhook] = await Promise.all([
      this.hooksRepository.markOrderAndPaymentSuccess(orderId),
      this.hooksRepository.updateWebhookStatus(
        webHookId,
        JobStatus.DONE,
        attempts,
      ),
      this.paymentIntent.markPaymentIntent(orderCode, PaymentStatus.SUCCESS),
    ]);
    const orders =
      await this.orderService.findOrderItemWWithParentVariantByOrderId(
        paidOrder.id,
      );
    const variantMapWithQuantity = new Map<string, number>(
      orders?.items.map((item) => [
        item.bookVariantSnapshot.bookVariant.id.toString(),
        item.quantity,
      ]),
    );

    try {
      await this.orderService.updateOrderDone(
        variantMapWithQuantity,
        paidOrder.id,
      );
    }
    catch {
      await this.orderService.updateOrderNotDone(
        variantMapWithQuantity,
        paidOrder.id,
      );
      throw new InternalServerErrorException()
    }

    return {
      paidOrder,
      doneWebhook,
    };

  };

  async handleSepayWebhook(body: SePayHooksDto) {
    Logger.debug('Received webhook event', body);
    const idempotencyKey = body.id;
    if (!idempotencyKey) {
      throw new BadRequestException(HooksMessage.MISSING_WEBHOOK_EVENT_ID);
    }

    const webhookInbox = await this.hooksRepository.saveSepayWebhook(
      idempotencyKey,
      body,
    );

    Logger.debug('Received webhook event webhookInbox', webhookInbox);
    // nếu cùng lúc đã thanh toán đủ nhưng bắn cùng 1 idempotencyKey quá nhiều , chỉ nhận 1
    if (webhookInbox.status === JobStatus.DONE) {
      return {
        success: true,
        idempotencyKey,
        webhookInboxId: webhookInbox.id.toString(),
        message: HooksMessage.WEBHOOK_ALREADY_PROCESSED,
      };
    }
    // Chưa đủ tiền nhưng gửi trùng, tăng số lần để đảm bảo không hụt tiền
    const attempts = (webhookInbox.attempts ?? 0) + 1;
    const orderCodeContent = body.content?.trim();

    if (!orderCodeContent) {
      return this.handleSepayWebhookWithoutContent(
        body,
        webhookInbox.id,
        attempts,
        idempotencyKey,
      );
    }

    const paymentIntent =
      await this.paymentIntent.findByContent(orderCodeContent);
    if (!paymentIntent) {
      await this.savePaymentTransaction(
        body,
        PaymentStatus.NOT_FOUND_ORDER_CODE,
        null,
      );

      return this.handlePaymentIntentNotFoundByContent(
        orderCodeContent,
        webhookInbox.id,
        attempts,
      );
    }

    const order = paymentIntent.order;
    if (!order) {
      await this.savePaymentTransaction(
        body,
        PaymentStatus.NOT_FOUND_ORDER_CODE,
        null,
      );

      await this.hooksRepository.updateWebhookStatus(
        webhookInbox.id,
        JobStatus.FAILED,
        attempts,
      );

      throw new BadRequestException(HooksMessage.ORDER_NOT_FOUND);
    }

    const orderRef: WebhookOrderRef = {
      id: order.id,
      userId: order.userId ?? null,
    };

    if (paymentIntent.expiredAt && paymentIntent.expiredAt < new Date()) {
      await this.savePaymentTransaction(body, PaymentStatus.EXPIRED, orderRef);

      return this.handlePaymentIntentExpired(
        orderCodeContent,
        webhookInbox.id,
        attempts,
        paymentIntent.orderCode,
      );
    }
    // Thành công trước rồi thì update lại success cho chắc
    if (paymentIntent.status === PaymentStatus.SUCCESS) {
      await this.savePaymentTransaction(body, PaymentStatus.SUCCESS, orderRef);

      return this.handleAlreadyProcessedPaymentIntent(
        orderCodeContent,
        paymentIntent.orderCode,
        webhookInbox.id,
        attempts,
        idempotencyKey,
      );
    }
    // tính toán
    if (Number(body.transferAmount) !== Number(order.totalAmount)) {
      const mismatchStatus =
        Number(body.transferAmount) < Number(order.totalAmount)
          ? PaymentStatus.PAYMENT_SHORTFALL
          : PaymentStatus.PAYMENT_OVERAGE;

      const result = await this.savePaymentTransaction(
        body,
        mismatchStatus,
        orderRef,
      );

      await this.hooksRepository.markPaymentNotSuccess(
        result.id,
        mismatchStatus,
      );

      await this.hooksRepository.updateWebhookStatus(
        webhookInbox.id,
        JobStatus.FAILED,
        attempts,
      );
      // trả quá tiền vẫn update thành công
      if (mismatchStatus === PaymentStatus.PAYMENT_OVERAGE) {
        return await this.handleAlreadyProcessedPaymentIntent(
          orderCodeContent,
          paymentIntent.orderCode,
          webhookInbox.id,
          attempts,
          idempotencyKey,
        );
      }
      return {
        success: false,
        idempotencyKey,
        content: orderCodeContent,
        webhookInboxId: webhookInbox.id.toString(),
        orderId: order.id.toString(),
        orderCode: order.orderCode,
        paymentStatus: mismatchStatus,
      };
    }

    await this.savePaymentTransaction(body, PaymentStatus.SUCCESS, orderRef);

    const { paidOrder, doneWebhook } = await this.handleSepayWebhookMarkDone(
      order.id,
      webhookInbox.id,
      attempts,
      paymentIntent.orderCode,
    );

    return {
      success: true,
      idempotencyKey,
      content: orderCodeContent,
      webhookInboxId: doneWebhook.id.toString(),
      orderId: paidOrder.id.toString(),
      orderCode: paidOrder.orderCode,
      orderStatus: paidOrder.status,
      paymentStatus: paidOrder.paymentStatus,
    };
  }

  async getPaymentStatus(orderCode: string) {
    const payment =
      await this.paymentIntent.findStatusPayByOrderCode(orderCode);
    if (!payment) {
      throw new NotFoundException(HooksMessage.ORDER_NOT_FOUND);
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      const order =
        await this.hooksRepository.findOrderStatusByOrderCode(orderCode);
      if (!order) {
        throw new NotFoundException(HooksMessage.ORDER_NOT_FOUND);
      }

      if (
        order.status !== OrderStatus.PAID ||
        order.paymentStatus !== PaymentStatus.SUCCESS
      ) {
        await this.hooksRepository.markOrderAndPaymentSuccess(order.id);
      }
    }

    return {
      paymentStatus: payment.status,
    };
  }

  getPaymentHistory(orderId: number) {
    return this.paymentService.getPaymentHistoryByOrderId(orderId, 10);
  }
}

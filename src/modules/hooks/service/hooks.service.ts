import { HooksMessage } from '@/common';
import { cacheKey } from '@/common/constants/cache-key.constant';
import { ORDER_STATUS_TTL } from '@/common/constants/enum-ttl.constant';
import { SePayHooksDto } from '@/modules/hooks/dto/request/sepay-hooks.dto';
import { OrderService } from '@/modules/order/service/order.service';
import { PaymentIntentService } from '@/modules/payment/service/payment-intent.service';
import { PaymentService } from '@/modules/payment/service/payment.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, PaymentStatus } from '@prisma/client';
import type { Cache } from 'cache-manager';
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
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly orderService: OrderService,
    private readonly paymentIntent: PaymentIntentService,
    private readonly transactionService: TransactionService,
  ) { }

  private async saveWebhookTransaction(
    body: SePayHooksDto,
    providerEventId: number,
    status: PaymentStatus,
    order?: WebhookOrderRef | null,
  ) {
    await this.paymentService.createWebhookSepayTransaction({
      amount: Number(body.transferAmount),
      orderId: order?.id ?? null,
      userId: order?.userId ?? null,
      referenceNumber: body.referenceCode?.toString().slice(0, 200) ?? null,
      requestId: body.code?.toString().slice(0, 100) ?? null,
      idempotencyKey,
      status,
      payload: body,
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
      this.paymentIntent.markPaymentIntentAsExpire(orderCode),
      this.hooksRepository.updateWebhookStatus(
        webHookId,
        JobStatus.FAILED,
        attempts,
        HooksMessage.PAYMENT_INTENT_EXPIRED,
      ),
    ]);

    return {
      ok: false,
      providerEventId: null,
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
      HooksMessage.PAYMENT_INTENT_NOT_FOUND,
    );

    return {
      ok: false,
      providerEventId: null,
      content,
      webhookInboxId: webHookId.toString(),
      message: HooksMessage.PAYMENT_INTENT_NOT_FOUND,
    };
  };

  private handleAlreadyProcessedPaymentIntent = async (
    content: string,
    webHookId: number,
    attempts: number,
    providerEventId: string,
  ) => {
    Logger.debug(
      'Payment intent already marked as success, skipping',
      content,
    );
    await this.hooksRepository.updateWebhookStatus(
      webHookId,
      JobStatus.DONE,
      attempts,
      HooksMessage.WEBHOOK_ALREADY_PROCESSED_FOR_SUCCESS_PAYMENT_INTENT,
    );
    return {
      ok: true,
      duplicate: true,
      providerEventId,
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
    await this.saveWebhookTransaction(
      body,
      idempotencyKey,
      PaymentStatus.NOT_FOUND_ORDER_CODE,
      null,
    );

    const doneWebhook = await this.hooksRepository.updateWebhookStatus(
      webHookId,
      JobStatus.DONE,
      attempts,
      HooksMessage.WEBHOOK_MISSING_TRANSFER_CONTENT_RECORDED,
    );

    return {
      ok: true,
      ignored: true,
      idempotencyKey,
      webhookInboxId: doneWebhook.id.toString(),
      message: HooksMessage.WEBHOOK_MISSING_TRANSFER_CONTENT,
    };
  };

  private handleSepayWebhookMarkDone = (
    orderId: number,
    webHookId: number,
    attempts: number,
    providerEventId: string,
    body: SePayHooksDto,
  ) => {
    return this.transactionService.doInTransaction(async (tx) => {
      const [paidOrder, doneWebhook] = await Promise.all([
        this.hooksRepository.markOrderAndPaymentSuccess(
          orderId,
          providerEventId,
          body,
          tx,
        ),
        this.hooksRepository.updateWebhookStatus(
          webHookId,
          JobStatus.DONE,
          attempts,
          undefined,
          tx,
        ),
      ]);

      const orders =
        await this.orderService.findOrderItemWWithParentVariantByOrderId(
          paidOrder.id,
          tx,
        );

      const variantMapWithQuantity = new Map<string, number>(
        orders?.items.map((item) => [
          item.bookVariantSnapshot.bookVariant.id.toString(),
          item.quantity,
        ]),
      );

      await this.orderService.updateOrderDone(
        variantMapWithQuantity,
        paidOrder.id,
        tx,
      );

      return {
        paidOrder, doneWebhook,
      };
    });
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

    if (webhookInbox.status === JobStatus.DONE) {
      return {
        ok: true,
        idempotencyKey,
        webhookInboxId: webhookInbox.id.toString(),
        message: HooksMessage.WEBHOOK_ALREADY_PROCESSED,
      };
    }

    const attempts = (webhookInbox.attempts ?? 0) + 1;
    const transferContent = body.content?.trim();

    if (!transferContent) {
      return this.handleSepayWebhookWithoutContent(
        body,
        webhookInbox.id,
        attempts,
        idempotencyKey,
      );
    }

    const paymentIntent = await this.paymentIntent.findByContent(transferContent);
    if (!paymentIntent) {
      await this.saveWebhookTransaction(
        body,
        idempotencyKey,
        PaymentStatus.NOT_FOUND_ORDER_CODE,
        null,
      );

      return this.handlePaymentIntentNotFoundByContent(
        transferContent,
        webhookInbox.id,
        attempts,
      );
    }

    const order = paymentIntent.order;
    if (!order) {
      await this.saveWebhookTransaction(
        body,
        idempotencyKey,
        PaymentStatus.NOT_FOUND_ORDER_CODE,
        null,
      );

      await this.hooksRepository.updateWebhookStatus(
        webhookInbox.id,
        JobStatus.FAILED,
        attempts,
        HooksMessage.ORDER_NOT_FOUND,
      );

      throw new BadRequestException(HooksMessage.ORDER_NOT_FOUND);
    }

    const orderRef: WebhookOrderRef = {
      id: order.id,
      userId: order.userId ?? null,
    };

    if (paymentIntent.expiredAt && paymentIntent.expiredAt < new Date()) {
      await this.saveWebhookTransaction(
        body,
        idempotencyKey,
        PaymentStatus.EXPIRED,
        orderRef,
      );

      return this.handlePaymentIntentExpired(
        transferContent,
        webhookInbox.id,
        attempts,
        paymentIntent.orderCode,
      );
    }

    if (paymentIntent.status === PaymentStatus.SUCCESS) {
      await this.saveWebhookTransaction(
        body,
        idempotencyKey,
        PaymentStatus.SUCCESS,
        orderRef,
      );

      return this.handleAlreadyProcessedPaymentIntent(
        transferContent,
        webhookInbox.id,
        attempts,
        idempotencyKey,
      );
    }

    if (Number(body.transferAmount) !== Number(order.totalAmount)) {
      const mismatchStatus =
        Number(body.transferAmount) < Number(order.totalAmount)
          ? PaymentStatus.PAYMENT_SHORTFALL
          : PaymentStatus.PAYMENT_OVERAGE;

      await this.saveWebhookTransaction(
        body,
        idempotencyKey,
        mismatchStatus,
        orderRef,
      );

      await this.hooksRepository.markPaymentNotSuccess(
        order.id,
        idempotencyKey,
        body,
        mismatchStatus,
      );

      await this.hooksRepository.updateWebhookStatus(
        webhookInbox.id,
        JobStatus.FAILED,
        attempts,
        HooksMessage.PAYMENT_AMOUNT_MISMATCH(order.orderCode),
      );

      return {
        ok: false,
        idempotencyKey,
        content: transferContent,
        webhookInboxId: webhookInbox.id.toString(),
        orderId: order.id.toString(),
        orderCode: order.orderCode,
        paymentStatus: mismatchStatus,
      };
    }

    await this.saveWebhookTransaction(
      body,
      providerEventId,
      PaymentStatus.SUCCESS,
      orderRef,
    );

    const { paidOrder, doneWebhook } = await this.handleSepayWebhookMarkDone(
      order.id,
      webhookInbox.id,
      attempts,
      idempotencyKey,
      body,
    );

    const orderStatusKey = cacheKey.order.status(paidOrder.orderCode);
    const cachedOrder = await this.cacheManager.get(orderStatusKey);

    if (cachedOrder) {
      await this.cacheManager.set(
        orderStatusKey,
        {
          id: paidOrder.id.toString(),
          orderCode: paidOrder.orderCode,
          status: paidOrder.status,
          paymentStatus: paidOrder.paymentStatus,
          updatedAt: paidOrder.updatedAt,
        },
        ORDER_STATUS_TTL,
      );
    }

    return {
      ok: true,
      providerEventId,
      content: transferContent,
      webhookInboxId: doneWebhook.id.toString(),
      orderId: paidOrder.id.toString(),
      orderCode: paidOrder.orderCode,
      orderStatus: paidOrder.status,
      paymentStatus: paidOrder.paymentStatus,
    };
  }

  async getOrderStatus(orderCode: string) {
    const orderStatusKey = cacheKey.order.status(orderCode);
    const cachedOrder = await this.cacheManager.get(orderStatusKey);

    if (cachedOrder) return cachedOrder;

    const order = await this.hooksRepository.findOrderStatusByOrderCode(orderCode);
    if (!order) {
      throw new NotFoundException(HooksMessage.ORDER_NOT_FOUND);
    }

    const response = {
      id: order.id.toString(),
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      updatedAt: order.updatedAt,
    };

    await this.cacheManager.set(orderStatusKey, response, ORDER_STATUS_TTL);

    return response;
  }

}

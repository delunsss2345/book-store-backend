import { HooksMessage } from '@/common';
import { ORDER_STATUS_TTL } from '@/common/constants/enum-ttl.constant';
import { SePayHooksDto } from '@/modules/hooks/dto/request/sepay-hooks.dto';
import { OrderRepository } from '@/modules/order/order.repository';
import { PaymentRepository } from '@/modules/payment/payment.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, PaymentGateway, PaymentStatus } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { HooksRepository } from './hooks.repository';

@Injectable()
export class HooksService {
  constructor(
    private readonly hooksRepository: HooksRepository,
    private readonly paymentRepository: PaymentRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly orderRepository: OrderRepository,
  ) {}

  async handleSepayWebhook(body: SePayHooksDto) {
    // Chống trùng lặp
    Logger.debug('Received webhook event', body);
    const providerEventId = this.extractProviderEventId(body);
    if (!providerEventId) {
      throw new BadRequestException(HooksMessage.MISSING_WEBHOOK_EVENT_ID);
    }
    // Check đã tồn tại web hook này chưa
    const existedWebhook =
      await this.hooksRepository.findWebhookByProviderEventId(providerEventId);

    Logger.debug('Received webhook event existedWebhook', existedWebhook);

    // Nếu tồn tại thì dùng, chưa thì lưu web hooks mới
    const webhookInbox =
      existedWebhook ??
      (await this.hooksRepository.saveSepayWebhook(providerEventId, body));

    Logger.debug('Received webhook event webhookInbox', webhookInbox);

    if (webhookInbox.status === JobStatus.DONE) {
      return {
        ok: true,
        duplicate: true,
        providerEventId,
        webhookInboxId: webhookInbox.id.toString(),
        message: 'Webhook already processed',
      };
    }

    const attempts = (webhookInbox.attempts ?? 0) + 1;
    // Check mã định danh orderCode ở trong webhooks check chắn chắn tất cả trường hợp có thể có
    // khi tất cả đều không có thì là failed
    const normalizedOrderCode = this.extractNormalizedOrderCode(body);

    if (!normalizedOrderCode) {
      await this.hooksRepository.updateWebhookStatus(
        webhookInbox.id,
        JobStatus.FAILED,
        attempts,
        HooksMessage.ORDER_CODE_NOT_FOUND_IN_WEBHOOK_PAYLOAD,
      );

      throw new BadRequestException(
        HooksMessage.ORDER_CODE_NOT_FOUND_IN_WEBHOOK_PAYLOAD,
      );
    }

    // Tạo tìm order cũ đó xem có không
    const order =
      await this.hooksRepository.findOrderByNormalizedOrderCode(
        normalizedOrderCode,
      );

    // Nếu không JOB FAILED
    if (!order) {
      await this.hooksRepository.updateWebhookStatus(
        webhookInbox.id,
        JobStatus.FAILED,
        attempts,
        `Không tìm thấy đơn hàng với mã: ${normalizedOrderCode}`,
      );

      throw new BadRequestException(HooksMessage.ORDER_NOT_FOUND);
    }
    if (!order?.subtotal) {
      throw new BadRequestException(HooksMessage.ORDER_NOT_FOUND);
    }

    // Nếu không bằng
    if (Number(body.transferAmount) !== Number(order?.totalAmount)) {
      Logger.debug(
        'subtotal',
        Number(body.transferAmount),
        Number(order?.totalAmount),
      );

      if (order.userId) {
        await this.paymentRepository.createPaymentTransaction(order.userId, {
          orderId: order.id,
          amount: body.transferAmount,
          gateway: PaymentGateway.SEPAY,
        });
      } else if (order.guestSessionId) {
        await this.paymentRepository.createPaymentTransactionGuestId({
          orderId: order.id,
          amount: body.transferAmount,
          gateway: PaymentGateway.SEPAY,
        });
      }
      // Check thanh toán sai
      if (body.transferAmount < Number(order?.totalAmount)) {
        return this.hooksRepository.markPaymentNotSuccess(
          order.id,
          providerEventId,
          body,
          PaymentStatus.PAYMENT_SHORTFALL,
        );
      } else {
        return this.hooksRepository.markPaymentNotSuccess(
          order.id,
          providerEventId,
          body,
          PaymentStatus.PAYMENT_OVERAGE,
        );
      }
    }
    const [paidOrder, doneWebhook] = await Promise.all([
      this.hooksRepository.markOrderAndPaymentSuccess(
        order.id,
        providerEventId,
        body,
      ),
      this.hooksRepository.updateWebhookStatus(
        webhookInbox.id,
        JobStatus.DONE,
        attempts,
      ),
    ]);

    // Lấy ra các order item
    const orders =
      await this.orderRepository.findOrderItemWWithParentVariantByOrderId(
        paidOrder.id,
      );
    // Chuyển thành bookVariantId, và quantity
    const variantMapWithQuantity = new Map<string, number>(
      orders?.items.map((item) => [
        item.bookVariantSnapshot.bookVariant.id.toString(),
        item.quantity,
      ]),
    );

    // Update trừ số quantity trong order vào variant
    await this.orderRepository.updateOrderDone(
      variantMapWithQuantity,
      paidOrder.id,
    );
    return {
      ok: true,
      duplicate: Boolean(existedWebhook),
      providerEventId,
      normalizedOrderCode,
      webhookInboxId: doneWebhook.id.toString(),
      orderId: paidOrder.id.toString(),
      orderCode: paidOrder.orderCode,
      orderStatus: paidOrder.status,
      paymentStatus: paidOrder.paymentStatus,
    };
  }

  async getOrderStatus(orderCode: string) {
    let order: Awaited<
      ReturnType<HooksRepository['findOrderByNormalizedOrderCode']>
    > = null;
    const orderCodeUppercase = orderCode.toUpperCase();
    const normalizedOrderCode = orderCodeUppercase.replace(/[^A-Z0-9]/g, '');

    const cachedOrder = await this.cacheManager.get(
      `order:status:${normalizedOrderCode}`,
    );
    if (cachedOrder) return cachedOrder;

    if (!order) {
      order =
        await this.hooksRepository.findOrderByNormalizedOrderCode(
          normalizedOrderCode,
        );
    }

    if (!order) {
      throw new NotFoundException(HooksMessage.ORDER_NOT_FOUND);
    }

    await this.cacheManager.set(
      `order:status:${normalizedOrderCode}`,
      order,
      ORDER_STATUS_TTL,
    );

    return {
      id: order.id.toString(),
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      updatedAt: order.updatedAt,
    };
  }

  private extractProviderEventId(body: SePayHooksDto): string | null {
    const raw = body.id ?? body.referenceCode ?? body.code;
    if (raw === undefined || raw === null) return null;
    return raw.toString().trim();
  }

  private extractNormalizedOrderCode(body: SePayHooksDto): string | null {
    const candidates = [
      body.content,
      body.description,
      body.code,
      body.referenceCode,
    ];

    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const upper = candidate.toUpperCase();
      const matched = upper.match(/OD[-_\s]*\d{6}[-_\s]*[A-Z0-9]{6,}/);
      if (!matched?.[0]) continue;

      const normalized = matched[0].replace(/[^A-Z0-9]/g, '');
      if (normalized.startsWith('OD')) {
        return normalized;
      }
    }

    return null;
  }
}

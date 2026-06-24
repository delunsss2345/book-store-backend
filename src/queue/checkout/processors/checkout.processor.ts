import { SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { ORDER_JOBS } from '@/common/constants/order-jobs.constant';
import { BookVariantSnapshotService } from '@/modules/book/snapshot/service/book-snapshot.service';
import { BookVariantService } from '@/modules/book/variant/service/bookVariant.service';
import { EmailOutboxService } from '@/modules/email-outbox/service/email-outbox.service';
import { GuestAddressDto } from '@/modules/order/dto/request/create-orders.dto';
import { OrderRepository } from '@/modules/order/repository/order.repository';
import { OrderAddressService } from '@/modules/order/service/order-address.service';
import { OrderItemService } from '@/modules/order/service/order-item.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import { EmailQueue } from '@/queue/email/email.queue';
import { generateContentHash } from '@/utils/generateContentHash.util';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { CurrencyCode, OrderStatus, PaymentStatus } from '@prisma/client';
import { Job } from 'bullmq';

export type CheckoutJobPayload = {
  isGuest: boolean;
  orderCode: string;
  totalAmount: number;
  subtotal: number;
  items: Array<{ bookVariantId: number; quantity: number }>;
  guestEmail?: string;
  guestSessionId?: string;
  guestAddress?: GuestAddressDto;
  addressId?: number;
  userId?: number;
  email?: string;
};

@Injectable()
@Processor('order')
export class CheckoutProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckoutProcessor.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly bookVariantService: BookVariantService,
    private readonly bookVariantSnapshotService: BookVariantSnapshotService,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemService: OrderItemService,
    private readonly orderAddressService: OrderAddressService,
    private readonly emailOutbox: EmailOutboxService,
    private readonly emailQueue: EmailQueue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === ORDER_JOBS.CHECKOUT) {
      await this.processCheckout(job);
    }
  }

  private async processCheckout(job: Job) {
    const payload = job.data as CheckoutJobPayload;
    this.logger.debug(`Processing checkout job ${job.id} - orderCode: ${payload.orderCode}`);

    await this.transactionService.doInTransaction(async (tx) => {
      const mapVariantIds = new Map<number, number>();
      payload.items.forEach((i) => mapVariantIds.set(i.bookVariantId, i.quantity));

      const variants = await this.bookVariantService.findByVariantIds([
        ...mapVariantIds.keys(),
      ]);

      const snapshots: {
        bookVariantSnapshotId: number;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }[] = [];

      await Promise.all(
        variants.map(async (variant) => {
          const quantity = mapVariantIds.get(variant.id)!;
          const unitPrice = Number(variant.price);
          const contentHash = generateContentHash({
            id: variant.id,
            format: variant.format,
            price: unitPrice,
            isbn: variant.isbn,
          });

          const snapshot = await this.bookVariantSnapshotService.upsertByContentHash(
            contentHash,
            {
              bookVariantId: variant.id,
              contentHash,
              priceSnapshot: unitPrice,
              formatSnapshot: variant.format,
            },
            tx,
          );

          snapshots.push({
            bookVariantSnapshotId: snapshot.id,
            quantity,
            unitPrice,
            lineTotal: unitPrice * quantity,
          });
        }),
      );

      if (payload.isGuest) {
        const order = await this.orderRepository.create(
          {
            guestSessionId: payload.guestSessionId,
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.PENDING,
            currencyCode: CurrencyCode.VND,
            orderCode: payload.orderCode,
            shippingFee: SHIPPING_FEE,
            expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
            totalAmount: payload.totalAmount,
            subtotal: payload.subtotal,
          },
          tx,
        );

        await this.orderItemService.createMany(order.id, snapshots, tx);

        const guestAddress = payload.guestAddress!;
        await this.orderAddressService.create(
          {
            orderId: order.id,
            recipientName: guestAddress.name,
            phoneNumber: guestAddress.phoneNumber,
            addressLine: guestAddress.addressLine,
            ward: guestAddress.ward,
            district: guestAddress.district,
            city: guestAddress.city,
            countryCode: 'VN',
            note: guestAddress.note,
          },
          tx,
        );

        if (payload.guestEmail) {
          const outbox = await this.emailOutbox.createOutboxOrderEmail({
            orderId: order.id,
            orderCode: order.orderCode,
            orderStatus: order.status ?? OrderStatus.PENDING_PAYMENT,
            toEmail: payload.guestEmail,
          });
          await this.emailQueue.enqueueOrderEmail(outbox.id);
        }
      } else {
        const order = await this.orderRepository.create(
          {
            userId: payload.userId,
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.PENDING,
            currencyCode: CurrencyCode.VND,
            orderCode: payload.orderCode,
            shippingFee: SHIPPING_FEE,
            expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
            totalAmount: payload.totalAmount,
            subtotal: payload.subtotal,
            addressId: payload.addressId,
          },
          tx,
        );

        await this.orderItemService.createMany(order.id, snapshots, tx);

        if (payload.email) {
          const outbox = await this.emailOutbox.createOutboxOrderEmail({
            orderId: order.id,
            orderCode: order.orderCode,
            orderStatus: order.status ?? OrderStatus.PENDING_PAYMENT,
            toEmail: payload.email,
          });
          await this.emailQueue.enqueueOrderEmail(outbox.id);
        }
      }
    });

    this.logger.debug(`Completed checkout job ${job.id} - orderCode: ${payload.orderCode}`);
  }
}

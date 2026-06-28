import { SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { ORDER_JOBS } from '@/common/constants/order-jobs.constant';
import { BookVariantSnapshotService } from '@/modules/book/snapshot/service/book-snapshot.service';
import { GuestAddressDto } from '@/modules/order/dto/request/create-orders.dto';
import { OrderRepository } from '@/modules/order/repository/order.repository';
import { OrderAddressService } from '@/modules/order/service/order-address.service';
import { OrderItemService } from '@/modules/order/service/order-item.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import { generateContentHash } from '@/utils/generateContentHash.util';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { BookFormat, CurrencyCode, OrderStatus, PaymentStatus } from '@prisma/client';
import { Job } from 'bullmq';

export type CheckoutJobPayload = {
  isGuest: boolean;
  orderCode: string;
  totalAmount: number;
  subtotal: number;
  variants: Array<{
    id: number;
    format: BookFormat;
    isbn: string;
    price: number;
    stock: number;
    isActive: boolean;
    edition: number;
  }>;
  mapVariantIds: Record<number, number>,
  guestEmail?: string;
  guestSessionId?: string;
  guestAddress?: GuestAddressDto;
  addressId?: number;
  userId?: number;
  email?: string;
};

@Injectable()
@Processor('order', { concurrency: 5 })
export class CheckoutProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckoutProcessor.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly bookVariantSnapshotService: BookVariantSnapshotService,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemService: OrderItemService,
    private readonly orderAddressService: OrderAddressService,
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
    const mapVariantIds = payload.mapVariantIds;
    this.logger.debug(`[${payload.orderCode}] START processCheckout job=${job.id} isGuest=${payload.isGuest} variants=${payload.variants.length}`);
    const variants = payload.variants;
    this.logger.debug(`[${payload.orderCode}] Building upsertSnapshots for ${variants.length} variant(s)`);

    const upsertSnapshots: {
      contentHash: string,
      bookVariantId: number,
      priceSnapshot: number,
      formatSnapshot: BookFormat,
    }[] = [];

    variants.map((variant) => {
      const unitPrice = Number(variant.price);
      const contentHash = generateContentHash({
        id: variant.id,
        format: variant.format,
        price: unitPrice,
        isbn: variant.isbn,
      });

      upsertSnapshots.push({
        contentHash,
        bookVariantId: variant.id,
        priceSnapshot: unitPrice,
        formatSnapshot: variant.format,
      });
    });

    this.logger.debug(`[${payload.orderCode}] createMany snapshots count=${upsertSnapshots.length}`);
    await this.bookVariantSnapshotService.createMany(upsertSnapshots);
    this.logger.debug(`[${payload.orderCode}] createMany done`);

    const foundSnapshots = await this.bookVariantSnapshotService.findAllByContentHashes(
      upsertSnapshots.map(s => s.contentHash),
    );
    this.logger.debug(`[${payload.orderCode}] findAllByContentHashes returned ${foundSnapshots.length} snapshot(s) ${JSON.stringify(foundSnapshots)}`);
    const snapshotIdMap = new Map(foundSnapshots.map(s => [s.contentHash, s.id]));
    this.logger.debug(`[${payload.orderCode}] snapshotIdMap size=${snapshotIdMap.size} keys=${JSON.stringify([...snapshotIdMap.keys()])}`);
    this.logger.debug(`[${payload.orderCode}] upsertSnapshots contentHashes=${JSON.stringify(upsertSnapshots.map(s => s.contentHash))}`);
    this.logger.debug(`${JSON.stringify(upsertSnapshots)}`)
    const snapshotItems = upsertSnapshots.map(s => {
      const quantity = mapVariantIds[s.bookVariantId];
      console.log(quantity);
      const bookVariantSnapshotId = snapshotIdMap.get(s.contentHash);
      this.logger.debug(
        `[${payload.orderCode}] mapping variantId=${s.bookVariantId} contentHash=${s.contentHash} -> snapshotId=${bookVariantSnapshotId} quantity=${quantity}`,
      );
      if (bookVariantSnapshotId === undefined) {
        this.logger.error(`[${payload.orderCode}] MISSING snapshot for contentHash=${s.contentHash} variantId=${s.bookVariantId}`);
      }
      if (quantity === undefined) {
        this.logger.error(`[${payload.orderCode}] MISSING quantity for variantId=${s.bookVariantId}`);
      }
      return {
        bookVariantSnapshotId: bookVariantSnapshotId!,
        quantity: quantity,
        unitPrice: s.priceSnapshot,
        lineTotal: s.priceSnapshot * quantity,
      };
    });
    this.logger.debug(`[${payload.orderCode}] snapshotItems built: ${JSON.stringify(snapshotItems)}`);

    if (payload.isGuest) {
      this.logger.debug(`[${payload.orderCode}] Creating order (guest)`);
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
      );
      try {
        this.logger.debug(`[${payload.orderCode}] Order created id=${order.id}`);

        await this.orderItemService.createMany(order.id, snapshotItems);

        this.logger.debug(`[${payload.orderCode}] Order items created`);

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
        );
        this.logger.debug(`[${payload.orderCode}] Guest address created`);

      }
      catch (err) {
        await this.orderRepository.deleteById(order.id);
        throw err;
      }
      // if (payload.guestEmail) {
      //   const outbox = await this.emailOutbox.createOutboxOrderEmail({
      //     orderId: order.id,
      //     orderCode: order.orderCode,
      //     orderStatus: order.status ?? OrderStatus.PENDING_PAYMENT,
      //     toEmail: payload.guestEmail,
      //   });
      //   await this.emailQueue.enqueueOrderEmail(outbox.id);
      // }
    } else {
      this.logger.debug(`[${payload.orderCode}] Creating order (user=${payload.userId})`);
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
      );
      try {
        this.logger.debug(`[${payload.orderCode}] Order created id=${order.id}`);

        await this.orderItemService.createMany(order.id, snapshotItems);
        this.logger.debug(`[${payload.orderCode}] Order items created`);
      }
      catch (err) {
        await this.orderRepository.deleteById(order.id);
        throw err;
      }

      // if (payload.email) {
      //   const outbox = await this.emailOutbox.createOutboxOrderEmail({
      //     orderId: order.id,
      //     orderCode: order.orderCode,
      //     orderStatus: order.status ?? OrderStatus.PENDING_PAYMENT,
      //     toEmail: payload.email,
      //   });
      //   await this.emailQueue.enqueueOrderEmail(outbox.id);
      // }
    }

    this.logger.debug(`[${payload.orderCode}] DONE processCheckout job=${job.id}`);
  }
}

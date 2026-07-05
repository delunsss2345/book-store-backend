import { ORDER_JOBS } from '@/common/constants/order-jobs.constant';
import { BookVariantSnapshotService } from '@/modules/book/snapshot/service/book-snapshot.service';
import { BookVariantService } from '@/modules/book/variant';
import { GuestAddressDto } from '@/modules/order/dto/request/create-orders.dto';
import { OrderAddressService } from '@/modules/order/service/order-address.service';
import { OrderItemService } from '@/modules/order/service/order-item.service';
import { OrderService } from '@/modules/order/service/order.service';
import { generateContentHash } from '@/utils/generateContentHash.util';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { BookFormat, PaymentGateway } from '@prisma/client';
import { Job } from 'bullmq';

export type CheckoutJobPayload = {
  orderId: number;
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
  isError: boolean
  payment: PaymentGateway
};

@Injectable()
@Processor('order', { concurrency: 5 })
export class CheckoutProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckoutProcessor.name);

  constructor(
    private readonly bookVariantSnapshotService: BookVariantSnapshotService,
    private readonly orderService: OrderService,
    private readonly orderItemService: OrderItemService,
    private readonly orderAddressService: OrderAddressService,
    private readonly bookVariantService: BookVariantService
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
    const payment = payload.payment;
    const mapVariantIds = payload.mapVariantIds;
    const isError = payload.isError;
    const variants = payload.variants;

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

    await this.bookVariantSnapshotService.createMany(upsertSnapshots);

    const foundSnapshots = await this.bookVariantSnapshotService.findAllByContentHashes(
      upsertSnapshots.map(s => s.contentHash),
    );

    const reservedVariant: {
      bookVariantId: number,
      quantity: number
    }[] = [];

    const snapshotIdMap = new Map(foundSnapshots.map(s => [s.contentHash, s.id]));
    const snapshotItems = upsertSnapshots.map(s => {
      const quantity = mapVariantIds[s.bookVariantId];
      const bookVariantSnapshotId = snapshotIdMap.get(s.contentHash);

      reservedVariant.push({
        bookVariantId: s.bookVariantId,
        quantity: quantity
      })

      return {
        bookVariantSnapshotId: bookVariantSnapshotId!,
        quantity: quantity,
        unitPrice: s.priceSnapshot,
        lineTotal: s.priceSnapshot * quantity,
      };
    });

    const orderId = payload.orderId;

    if (payload.isGuest) {
      try {
        await this.orderItemService.createMany(orderId, snapshotItems);
        const guestAddress = payload.guestAddress!;

        await this.orderAddressService.create(
          {
            orderId,
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
        if (!isError) {
          if (payment === PaymentGateway.COD) {
            await this.bookVariantService.updateReservedByIds(reservedVariant)
          }
        }
      }
      catch (err) {
        await this.orderService.deleteOrder(orderId);
        throw err;
      }
    } else {
      try {
        await this.orderItemService.createMany(orderId, snapshotItems);
        if (!isError) {
          await this.bookVariantService.updateReservedByIds(reservedVariant)
        }
      }
      catch (err) {
        await this.orderService.deleteOrder(orderId);
        throw err;
      }
    }

    this.logger.debug(`[${payload.orderCode}] DONE processCheckout job=${job.id}`);
  }
}

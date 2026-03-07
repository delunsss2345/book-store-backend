import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminOrderRepository } from './admin-order.repository';
import { AdminOrderListQueryDto } from '../dto/request';
import {
  AdminOrderDetailResponseDto,
  AdminOrderItemResponseDto,
  AdminOrderListResponseDto,
} from '../dto/response';

type OrderRow = Awaited<ReturnType<AdminOrderRepository['findOrders']>>[number];

@Injectable()
export class AdminOrderService {
  constructor(private readonly adminOrderRepository: AdminOrderRepository) {}

  async getOrders(
    query: AdminOrderListQueryDto,
  ): Promise<AdminOrderListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminOrderRepository.countOrders(),
      this.adminOrderRepository.findOrders(page, limit),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
      items: rows.map((row) => this.toOrderItem(row)),
    };
  }

  async getOrderDetail(orderId: bigint): Promise<AdminOrderDetailResponseDto> {
    const row = await this.adminOrderRepository.findOrderDetailById(orderId);
    if (!row) {
      throw new NotFoundException('Order not found');
    }

    return {
      ...this.toOrderItem(row),
      items: row.items.map((item) => ({
        id: item.id.toString(),
        bookVariantSnapshotId: item.bookVariantSnapshotId.toString(),
        quantity: item.quantity,
        unitPrice: this.toDecimalText(item.unitPrice) as string,
        lineTotal: this.toDecimalText(item.lineTotal) as string,
        createdAt: item.createdAt,
        titleSnapshot: item.bookVariantSnapshot.titleSnapshot ?? null,
        coverImageUrlSnapshot:
          item.bookVariantSnapshot.coverImageUrlSnapshot ?? null,
        skuSnapshot: item.bookVariantSnapshot.skuSnapshot,
        priceSnapshot: this.toDecimalText(
          item.bookVariantSnapshot.priceSnapshot,
        ) as string,
        currencyCodeSnapshot:
          item.bookVariantSnapshot.currencyCodeSnapshot ?? null,
        formatSnapshot: String(item.bookVariantSnapshot.formatSnapshot),
        editionSnapshot: item.bookVariantSnapshot.editionSnapshot ?? null,
        isbnSnapshot: item.bookVariantSnapshot.isbnSnapshot ?? null,
      })),
    };
  }

  private toOrderItem(row: OrderRow): AdminOrderItemResponseDto {
    return {
      id: row.id.toString(),
      orderCode: row.orderCode,
      userId: row.userId ? row.userId.toString() : null,
      guestSessionId: row.guestSessionId ?? null,
      guestEmail: row.guestEmail ?? null,
      status: row.status ? String(row.status) : null,
      paymentStatus: row.paymentStatus ? String(row.paymentStatus) : null,
      subtotal: this.toDecimalText(row.subtotal),
      discountAmount: this.toDecimalText(row.discountAmount),
      shippingFee: this.toDecimalText(row.shippingFee),
      totalAmount: this.toDecimalText(row.totalAmount),
      currencyCode: row.currencyCode ?? null,
      placedAt: row.placedAt ?? null,
      createdAt: row.createdAt,
      expiredAt: row.expiredAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDecimalText(
    value: Prisma.Decimal | number | null | undefined,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value).toFixed(2);
  }
}

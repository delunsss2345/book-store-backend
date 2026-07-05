import { Prisma } from '@prisma/client';
import { OrderListRow } from '../repository/order.repository';

export type OrderListItemResponse = {
  id: number;
  orderCode: string;
  status: string | null;
  placedAt: Date;
  subtotal: number | null;
  shippingFee: number | null;
  discountAmount: number | null;
  totalAmount: number | null;
};

function toDecimalNumber(
  value: Prisma.Decimal | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

export const OrderMapper = {
  toListItem(row: OrderListRow): OrderListItemResponse {
    return {
      id: row.id,
      orderCode: row.orderCode,
      status: row.status ? String(row.status) : null,
      placedAt: row.placedAt ?? row.createdAt,
      subtotal: toDecimalNumber(row.subtotal),
      shippingFee: toDecimalNumber(row.shippingFee),
      discountAmount: toDecimalNumber(row.discountAmount),
      totalAmount: toDecimalNumber(row.totalAmount),
    };
  },

  toList(rows: OrderListRow[]): OrderListItemResponse[] {
    return rows.map((row) => this.toListItem(row));
  },
};

import { Prisma } from '@prisma/client';
import { PurchaseOrderRepository } from '../repository/purchase-order.repository';

type PurchaseOrderDetailRow = NonNullable<
  Awaited<ReturnType<PurchaseOrderRepository['findPurchaseOrderById']>>
>;

type PurchaseOrderItemRow = PurchaseOrderDetailRow['items'][number];
type PurchaseOrderDetailItemRow = Awaited<
  ReturnType<PurchaseOrderRepository['findPurchaseOrderItemsByPurchaseOrderId']>
>[number];

export type PurchaseOrderCreateResponse = {
  id: string;
  supplierId: string;
  code: string;
  status: string;
  note: string | null;
  totalAmount: number;
  taxAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    purchaseOrderId: string;
    bookVariantId: string;
    quantity: number;
    unitPrice: number;
    discountPrice: number;
    price: number;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

export type PurchaseOrderDetailItemResponse = {
  id: string;
  purchaseOrderId: string;
  bookVariantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  title: string | null;
  format: string;
};

export function toDecimalNumber(value: Prisma.Decimal | number): number {
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

function toPurchaseOrderItem(
  row: PurchaseOrderItemRow,
): PurchaseOrderCreateResponse['items'][number] {
  return {
    id: row.id,
    purchaseOrderId: row.purchaseOrderId,
    bookVariantId: row.bookVariantId.toString(),
    quantity: row.quantity,
    unitPrice: toDecimalNumber(row.unitPrice),
    discountPrice: toDecimalNumber(row.discountPrice),
    price: toDecimalNumber(row.price),
    totalPrice: toDecimalNumber(row.totalPrice),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPurchaseOrderCreateResponse(
  row: PurchaseOrderDetailRow,
): PurchaseOrderCreateResponse {
  return {
    id: row.id,
    supplierId: row.supplierId.toString(),
    code: row.code,
    status: row.status,
    note: row.note ?? null,
    totalAmount: toDecimalNumber(row.totalAmount),
    taxAmount: toDecimalNumber(row.taxAmount),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: row.items.map((item) => toPurchaseOrderItem(item)),
  };
}

export function toPurchaseOrderDetailItem(
  row: PurchaseOrderDetailItemRow,
): PurchaseOrderDetailItemResponse {
  return {
    id: row.id,
    purchaseOrderId: row.purchaseOrderId,
    bookVariantId: row.bookVariantId.toString(),
    quantity: row.quantity,
    unitPrice: toDecimalNumber(row.unitPrice),
    totalPrice: toDecimalNumber(row.totalPrice),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    title: row.bookVariant.book.translations[0]?.title ?? null,
    format: String(row.bookVariant.format),
  };
}

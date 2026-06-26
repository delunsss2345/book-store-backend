import { Prisma } from '@prisma/client';

export const purchaseOrderItemSelect = {
  id: true,
  purchaseOrderId: true,
  bookVariantId: true,
  quantity: true,
  unitPrice: true,
  discountPrice: true,
  price: true,
  totalPrice: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const purchaseOrderSummarySelect = {
  id: true,
  supplierId: true,
  code: true,
  status: true,
  statusTransfer: true,
  note: true,
  totalAmount: true,
  taxAmount: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const purchaseOrderListSelect = {
  ...purchaseOrderSummarySelect,
  supplier: true,
} satisfies Prisma.PurchaseOrderSelect;

export const purchaseOrderDetailSelect = {
  ...purchaseOrderSummarySelect,
  items: {
    select: purchaseOrderItemSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
} satisfies Prisma.PurchaseOrderSelect;

export function buildPurchaseOrderItemWithBookVariantSelect(
  languageId: number,
) {
  return {
    ...purchaseOrderItemSelect,
    bookVariant: {
      select: {
        format: true,
        book: {
          select: {
            translations: {
              where: { languageId },
              take: 1,
              select: {
                title: true,
              },
            },
          },
        },
      },
    },
  } satisfies Prisma.PurchaseOrderItemSelect;
}

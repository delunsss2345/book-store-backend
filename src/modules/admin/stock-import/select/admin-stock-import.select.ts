import { Prisma } from '@prisma/client';

export const adminStockImportListSelect = {
  id: true,
  purchaseOrderId: true,
  supplierId: true,
  note: true,
  totalAmount: true,
  taxAmount: true,
  createdAt: true,
  supplier: {
    select: { name: true },
  },
  creator: {
    select: { firstName: true, lastName: true },
  },
} satisfies Prisma.StockImportSelect;

export const adminStockImportDetailSelect = {
  ...adminStockImportListSelect,
  items: {
    select: {
      id: true,
      bookVariantId: true,
      quantity: true,
      importPrice: true,
    },
    orderBy: [{ id: 'asc' as const }],
  },
} satisfies Prisma.StockImportSelect;

export type AdminStockImportListRow = Prisma.StockImportGetPayload<{
  select: typeof adminStockImportListSelect;
}>;

export type AdminStockImportDetailRow = Prisma.StockImportGetPayload<{
  select: typeof adminStockImportDetailSelect;
}>;

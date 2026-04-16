import { Prisma } from '@prisma/client';

export const stockImportListSelect = {
  id: true,
  purchaseOrderId: true,
  supplierId: true,
  note: true,
  totalAmount: true,
  taxAmount: true,
  createdAt: true,
  supplier: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.StockImportSelect;

export type StockImportListRow = Prisma.StockImportGetPayload<{
  select: typeof stockImportListSelect;
}>;

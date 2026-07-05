import { Prisma } from '@prisma/client';

export const supplierItemSelect = {
  id: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SupplierSelect;

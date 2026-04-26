import { Prisma } from '@prisma/client';

export const bookVariantInventorySelect = {
  id: true,
  stock: true,
  costPrice: true,
  price: true,
} satisfies Prisma.BookVariantSelect;

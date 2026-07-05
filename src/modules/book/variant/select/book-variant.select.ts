import { Prisma } from '@prisma/client';

export const bookVariantInventorySelect = {
  id: true,
  stock: true,
  price: true,
} satisfies Prisma.BookVariantSelect;

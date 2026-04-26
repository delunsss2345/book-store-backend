import { Prisma } from '@prisma/client';

const stockImportItemBaseSelect = {
  id: true,
  stockImportId: true,
  bookVariantId: true,
  quantity: true,
  importPrice: true,
} as const;

export function buildStockImportItemSelect(languageId: number) {
  return {
    ...stockImportItemBaseSelect,
    variant: {
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
  } satisfies Prisma.StockImportItemSelect;
}

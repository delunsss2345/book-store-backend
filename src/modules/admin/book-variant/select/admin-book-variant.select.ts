import { Prisma } from '@prisma/client';

const adminBookVariantItemSelect = {
  id: true,
  format: true,
  edition: true,
  isbn: true,
  costPrice: true,
  price: true,
  currencyCode: true,
  stock: true,
  isActive: true,
} as const;

const adminBookVariantOrderBy: Prisma.BookVariantOrderByWithRelationInput[] = [
  { id: 'asc' },
];

const adminBookVariantListSelect = {
  select: adminBookVariantItemSelect,
  orderBy: adminBookVariantOrderBy,
} satisfies Prisma.Book$variantsArgs;

export function buildAdminBookVariantListSelect(languageId: number) {
  return {
    id: true,
    coverImageUrl: true,
    isActive: true,
    translations: {
      where: { languageId },
      select: {
        id: true,
        languageId: true,
        title: true,
        slug: true,
      },
      take: 1,
    },
    authors: true,
    variants: adminBookVariantListSelect,
  } satisfies Prisma.BookSelect;
}

export const adminBookVariantTranslationCreateSelect = {
  id: true,
  languageId: true,
  title: true,
  description: true,
  slug: true,
} satisfies Prisma.BookTranslationSelect;

export const adminBookVariantSnapshotSelect = {
  id: true,
  bookVariantId: true,
  priceSnapshot: true,
  currencyCodeSnapshot: true,
  formatSnapshot: true,
  isbnSnapshot: true,
  createdAt: true,
  bookVariant: {
    select: {
      bookId: true,
    },
  },
} satisfies Prisma.BookVariantSnapshotSelect;

import { Prisma } from '@prisma/client';

const adminBookBaseSelect = {
  id: true,
  publisherId: true,
  publicationYear: true,
  pageCount: true,
  weightGrams: true,
  coverImageUrl: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const adminBookTranslationItemSelect = {
  id: true,
  languageId: true,
  title: true,
  description: true,
  slug: true,
} as const;

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

export const adminBookSelect = {
  ...adminBookBaseSelect,
  translations: {
    select: adminBookTranslationItemSelect,
    orderBy: [{ languageId: 'asc' }],
  },
  publisher: {
    select: {
      id: true,
      defaultName: true,
    },
  },
  authors: {
    select: {
      author: {
        select: {
          id: true,
          defaultName: true,
        },
      },
    },
  },
  variants: adminBookVariantListSelect,
} satisfies Prisma.BookSelect;

export const adminBookDetailSelect = {
  ...adminBookBaseSelect,
  translations: true,
  variants: adminBookVariantListSelect,
} satisfies Prisma.BookSelect;

export function buildAdminBookListSelect(languageId: number) {
  return {
    ...adminBookBaseSelect,
    translations: {
      where: { languageId },
      select: adminBookTranslationItemSelect,
      take: 1,
    },
    variants: adminBookVariantListSelect,
  } satisfies Prisma.BookSelect;
}

export const adminBookTranslationCreateSelect = {
  id: true,
  languageId: true,
  title: true,
  description: true,
  slug: true,
} satisfies Prisma.BookTranslationSelect;

export const adminBookSnapshotSelect = {
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

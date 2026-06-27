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

const adminBookVariantPurchaseOrderItemSelect = {
  id: true,
  purchaseOrderId: true,
  unitPrice: true,
  discountPrice: true,
  price: true,
} satisfies Prisma.PurchaseOrderItemSelect;

const adminBookVariantForDetailItemSelect = {
  id: true,
  format: true,
  edition: true,
  isbn: true,
  price: true,
  currencyCode: true,
  stock: true,
  isActive: true,
  purchaseOrderItem: {
    select: adminBookVariantPurchaseOrderItemSelect,
    orderBy: [{ createdAt: 'desc' as const }],
  },
} satisfies Prisma.BookVariantSelect;

export const adminBookVariantForDetailSelect = {
  select: adminBookVariantForDetailItemSelect,
  orderBy: adminBookVariantOrderBy,
} satisfies Prisma.Book$variantsArgs;

export type AdminBookVariantPurchaseOrderItemRow = Prisma.PurchaseOrderItemGetPayload<{
  select: typeof adminBookVariantPurchaseOrderItemSelect;
}>;

export type AdminBookVariantForDetailRow = Prisma.BookVariantGetPayload<{
  select: typeof adminBookVariantForDetailItemSelect;
}>;

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
  translations: {
    select: adminBookTranslationItemSelect,
    orderBy: [{ languageId: 'asc' as const }],
  },
  publisher: { select: { id: true, defaultName: true } },
  authors: { select: { author: { select: { id: true, defaultName: true } } } },
  variants: adminBookVariantForDetailSelect,
} satisfies Prisma.BookSelect;

export type AdminBookDetailRow = Prisma.BookGetPayload<{
  select: typeof adminBookDetailSelect;
}>;

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

const adminBookVariantPurchaseOrderItemIdSelect = {
  id: true,
} satisfies Prisma.PurchaseOrderItemSelect;

const adminBookVariantPriceViewItemSelect = {
  id: true,
  price: true,
  isActive: true,
  purchaseOrderItem: {
    select: adminBookVariantPurchaseOrderItemIdSelect,
    orderBy: [{ createdAt: 'desc' as const }],
  },
} satisfies Prisma.BookVariantSelect;

export const adminBookPriceViewSelect = {
  id: true,
  deletedAt: true,
  variants: {
    where: { isActive: true },
    select: adminBookVariantPriceViewItemSelect,
    orderBy: adminBookVariantOrderBy,
  },
} satisfies Prisma.BookSelect;

export type AdminBookPriceViewRow = Prisma.BookGetPayload<{
  select: typeof adminBookPriceViewSelect;
}>;

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

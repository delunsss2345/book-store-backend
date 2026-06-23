import {
  CatalogBookCardDto,
  CatalogBookDetailDto,
  CatalogBookSpecDto,
  CatalogBookVariantDto,
  CatalogCategoryDto,
  CatalogCategoryTreeDto,
} from '@/modules/book/catalog/dto/response';
import { Badge } from '@prisma/client';
import { CatalogRepository } from '../repository/catalog.repository';

type CategoryRow = Awaited<
  ReturnType<CatalogRepository['findActiveCategoriesByLanguage']>
>[number];

type BookDetailByIdRow = NonNullable<
  Awaited<ReturnType<CatalogRepository['findBookDetailById']>>
>;

type BookListRow = Awaited<
  ReturnType<CatalogRepository['findBooksForList']>
>[number];

type BookCardRow = Awaited<
  ReturnType<CatalogRepository['findBooksByIds']>
>[number];

type BookCategoryRow = BookListRow['categories'][number];
type BookCardSource = BookListRow | BookCardRow;

export function buildCatalogCategoryTree(
  rows: CategoryRow[],
): CatalogCategoryTreeDto[] {
  const nodes = new Map<number, CatalogCategoryTreeDto>();

  for (const row of rows) {
    const [translation] = row.categoryTranslation;
    if (!translation?.name) continue;

    nodes.set(row.id, {
      id: row.id,
      parentId: row.parentId ?? null,
      name: translation.name,
      slug: translation.slug ?? null,
      sortOrder: row.sortOrder ?? 0,
      children: [],
    });
  }

  const roots: CatalogCategoryTreeDto[] = [];
  for (const node of nodes.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(node.parentId);
    if (!parent) continue;
    parent.children.push(node);
  }

  sortCategoryTree(roots);
  return roots;
}

export function toCatalogListBookCard(
  book: BookCardSource,
): CatalogBookCardDto {
  const [translation] = book.translations;
  const cheapestVariant = book.variants[0];
  const stock = cheapestVariant?.stock ?? 0;

  return {
    id: book.id,
    title: translation?.title ?? `Book ${book.id}`,
    slug: translation?.slug ?? null,
    coverImageUrl: book.coverImageUrl ?? null,
    price: toFixedPrice(cheapestVariant?.price),
    currencyCode: cheapestVariant?.currencyCode ?? null,
    isOutOfStock: !cheapestVariant || stock <= 0,
    createdAt: book.createdAt,
    bookVariantId: cheapestVariant?.id,
    format: cheapestVariant?.format ?? null,
    categories: toCatalogBookCategories(book.categories ?? []),
    badges: (book.bookBadge ?? []).map((badge) => badge.code),
  };
}

export function toCatalogBookDetail(
  book: BookDetailByIdRow,
  slugFallback?: string,
  recommend?: CatalogBookCardDto[],
): CatalogBookDetailDto {
  const [translation] = book.translations;

  return {
    id: book.id,
    title: translation?.title ?? `Book ${book.id}`,
    slug: translation?.slug ?? slugFallback ?? null,
    description: translation?.description ?? null,
    coverImageUrl: book.coverImageUrl ?? null,
    publicationYear: book.publicationYear ?? null,
    pageCount: book.pageCount ?? null,
    weightGrams: book.weightGrams ?? null,
    publisherName: book.publisher?.defaultName ?? null,
    variants: toCatalogBookVariants(book),
    categories: toCatalogBookCategories(book.categories ?? []),
    specs: toCatalogBookSpecs(book),
    badges: toCatalogBookBadges(book),
    createdAt: book.createdAt,
    recommend: recommend ?? [],
  };
}

export function toCatalogBookCard(
  book: BookCardRow,
  soldCount?: number,
): CatalogBookCardDto {
  const [translation] = book.translations;
  const cheapestVariant = book.variants[0];

  return {
    id: book.id,
    title: translation?.title ?? `Book ${book.id}`,
    slug: translation?.slug ?? null,
    coverImageUrl: book.coverImageUrl,
    soldCount: soldCount ?? 0,
    createdAt: book.createdAt,
    badges: (book.bookBadge ?? []).map((badge) => badge.code),
    bookVariantId: cheapestVariant?.id,
    price: toFixedPrice(cheapestVariant?.price),
    description: translation?.description ?? null,
    currencyCode: cheapestVariant?.currencyCode ?? 'VND',
    format: cheapestVariant?.format ?? null,
    isOutOfStock: !cheapestVariant || (cheapestVariant.stock ?? 0) <= 0,
  };
}

function toCatalogBookCategories(
  bookCategories: BookCategoryRow[],
): CatalogCategoryDto[] {
  return bookCategories.map((x) => {
    const category = x.category;
    const [translation] = category.categoryTranslation;

    return {
      id: category.id,
      parentId: category.parentId ? category.parentId : null,
      sortOrder: category.sortOrder ?? 0,
      name: translation?.name ?? `Category ${category.id}`,
      slug: translation?.slug ?? null,
    };
  });
}

function toCatalogBookVariants(
  book: BookDetailByIdRow,
): CatalogBookVariantDto[] {
  return (book.variants ?? []).map((variant) => ({
    id: variant.id,
    format: variant.format,
    edition: variant.edition,
    isbn: variant.isbn,
    price: String(variant.price),
    currencyCode: variant.currencyCode,
    available: variant.available,
  }));
}

function toCatalogBookSpecs(book: BookDetailByIdRow): CatalogBookSpecDto {
  const specs = book.specs;
  if (!specs) {
    return {};
  }

  return {
    widthCm: toNullableString(specs.widthCm),
    heightCm: toNullableString(specs.heightCm),
    thicknessCm: toNullableString(specs.thicknessCm),
    packaging: specs.packaging ?? null,
  };
}

function toCatalogBookBadges(book: BookDetailByIdRow): Badge[] {
  return (book.bookBadge ?? []).map((badge) => badge.code);
}

function sortCategoryTree(nodes: CatalogCategoryTreeDto[]): void {
  nodes.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id - b.id;
  });

  for (const node of nodes) {
    sortCategoryTree(node.children);
  }
}

function toFixedPrice(
  value: { toString: () => string } | number | string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : null;
}

function toNullableString(
  value: { toString: () => string } | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return value.toString();
}

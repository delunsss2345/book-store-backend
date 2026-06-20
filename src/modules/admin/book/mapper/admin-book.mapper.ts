import {
  AdminBookItemResponseDto,
  AdminBookSnapshotItemResponseDto,
  AdminBookTranslationResponseDto,
  AdminBookVariantItemResponseDto,
} from '@/modules/admin/dto/response';
import { AdminBookDetailResponseDto } from '@/modules/admin/dto/response/admin-book-detail.response.dto';
import { AdminBookItemUpdateResponseDto } from '@/modules/admin/dto/response/admin-book-update.response.dto';
import { Prisma } from '@prisma/client';
import { AdminBookRepository } from '../admin-book.repository';

type BookRow = NonNullable<
  Awaited<ReturnType<AdminBookRepository['findBookById']>>
>;
type BookListRow = Awaited<
  ReturnType<AdminBookRepository['findBooks']>
>[number];
type SnapshotRow = Awaited<
  ReturnType<AdminBookRepository['findBookSnapshots']>
>[number];

export function toDecimalText(
  value: Prisma.Decimal | number | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value).toFixed(2);
}

export function toAdminBookItem(row: BookRow): AdminBookItemResponseDto {
  const translation = row.translations[0] ?? null;

  return {
    id: row.id.toString(),
    publisherId: row.publisherId ? row.publisherId.toString() : null,
    publicationYear: row.publicationYear ?? null,
    pageCount: row.pageCount ?? null,
    weightGrams: row.weightGrams ?? null,
    coverImageUrl: row.coverImageUrl ?? null,
    isActive: row.isActive,
    deletedAt: row.deletedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    translation: translation
      ? {
        id: translation.id.toString(),
        languageId: translation.languageId,
        title: translation.title,
        description: translation.description ?? null,
        slug: translation.slug ?? '',
      }
      : null,
    variants: row.variants.map((variant) => ({
      id: variant.id.toString(),
      format: String(variant.format),
      edition: variant.edition ?? null,
      isbn: variant.isbn ?? null,
      costPrice: toDecimalText(variant.costPrice) as string,
      price: toDecimalText(variant.price) as string,
      currencyCode: variant.currencyCode ?? null,
      stock: variant.stock ?? null,
      isActive: variant.isActive,
    })),
  };
}

export function toAdminBookListItem(
  row: BookListRow,
): AdminBookItemResponseDto {
  const translation = row.translations[0] ?? null;

  return {
    id: row.id.toString(),
    publisherId: row.publisherId ? row.publisherId.toString() : null,
    publicationYear: row.publicationYear ?? null,
    pageCount: row.pageCount ?? null,
    weightGrams: row.weightGrams ?? null,
    coverImageUrl: row.coverImageUrl ?? null,
    isActive: row.isActive,
    deletedAt: row.deletedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    translation: translation
      ? {
        id: translation.id.toString(),
        languageId: translation.languageId,
        title: translation.title,
        description: translation.description ?? null,
        slug: translation.slug ?? '',
      }
      : null,
    variants: row.variants.map((variant) => ({
      id: variant.id.toString(),
      format: String(variant.format),
      edition: variant.edition ?? null,
      isbn: variant.isbn ?? null,
      costPrice: toDecimalText(variant.costPrice) as string,
      price: toDecimalText(variant.price) as string,
      currencyCode: variant.currencyCode ?? null,
      stock: variant.stock ?? null,
      isActive: variant.isActive,
    })),
  };
}

export function toSnapshotItem(
  row: SnapshotRow,
): AdminBookSnapshotItemResponseDto {
  return {
    id: row.id.toString(),
    bookVariantId: row.bookVariantId.toString(),
    bookId: row.bookVariant.bookId.toString(),
    priceSnapshot: toDecimalText(row.priceSnapshot) as string,
    currencyCodeSnapshot: row.currencyCodeSnapshot ?? null,
    formatSnapshot: String(row.formatSnapshot),
    isbnSnapshot: row.isbnSnapshot ?? null,
    createdAt: row.createdAt,
  };
}

export function toBookDetail(book: any): AdminBookDetailResponseDto {
  return {
    id: String(book.id),
    publisherId: book.publisherId != null ? String(book.publisherId) : null,
    publicationYear: book.publicationYear ?? null,
    pageCount: book.pageCount ?? null,
    weightGrams: book.weightGrams ?? null,
    coverImageUrl: book.coverImageUrl ?? null,
    isActive: Boolean(book.isActive),
    deletedAt: book.deletedAt ?? null,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
    translation: Array.isArray(book.translation || book.translations)
      ? (book.translation || book.translations).map(
        (item: any): AdminBookTranslationResponseDto => ({
          id: String(item.id),
          languageId: Number(item.languageId),
          title: item.title,
          description: item.description ?? null,
          slug: item.slug,
        }),
      )
      : [],
    authorName:
      book.authors && book.authors.length > 0
        ? book.authors[0].author.defaultName
        : null,
    publisherName: book.publisher ? book.publisher?.defaultName : null,
    variants: Array.isArray(book.variants)
      ? book.variants.map(
        (item: any): AdminBookVariantItemResponseDto => ({
          id: String(item.id),
          format: item.format,
          edition: item.edition ?? null,
          isbn: item.isbn ?? null,
          costPrice: String(item.costPrice),
          price: String(item.price),
          currencyCode: item.currencyCode ?? null,
          stock: item.stock ?? null,
          isActive: Boolean(item.isActive),
        }),
      )
      : [],
  };
}

export function toMapperUpdateBook(
  updatedBook: any,
): AdminBookItemUpdateResponseDto {
  const response: AdminBookItemUpdateResponseDto = {
    id: updatedBook.id.toString(),
    publisherId: updatedBook.publisherId?.toString() ?? null,
    publicationYear: updatedBook.publicationYear,
    pageCount: updatedBook.pageCount,
    weightGrams: updatedBook.weightGrams,
    coverImageUrl: updatedBook.coverImageUrl,
    isActive: updatedBook.isActive,
    deletedAt: updatedBook.deletedAt,
    createdAt: updatedBook.createdAt,
    updatedAt: updatedBook.updatedAt,
    translations: updatedBook.translations.map((item) => ({
      id: item.id.toString(),
      languageId: item.languageId,
      title: item.title,
      description: item.description,
      slug: item.slug,
      code: item.code,
    })),
    variants: updatedBook.variants.map((item) => ({
      id: item.id.toString(),
      format: item.format,
      edition: item.edition,
      isbn: item.isbn,
      costPrice: item.costPrice?.toString() ?? null,
      price: item.price.toString(),
      currencyCode: item.currencyCode,
      stock: item.stock,
      isActive: item.isActive,
    })),
  };

  return response;
}

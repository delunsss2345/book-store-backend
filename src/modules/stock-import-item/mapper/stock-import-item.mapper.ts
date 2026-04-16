import { Prisma } from '@prisma/client';
import { StockImportItemDetailResponseDto } from '../dto';
import { StockImportItemRepository } from '../stock-import-item.repository';

type StockImportItemRow = Awaited<
  ReturnType<StockImportItemRepository['findStockImportItemsByStockImportId']>
>[number];

export function toDecimalNumber(value: Prisma.Decimal | number): number {
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

export function toStockImportItemDetail(
  row: StockImportItemRow,
): StockImportItemDetailResponseDto {
  return {
    id: row.id,
    stockImportId: row.stockImportId,
    bookVariantId: row.bookVariantId.toString(),
    quantity: row.quantity,
    importPrice: toDecimalNumber(row.importPrice),
    title: row.variant.book.translations[0]?.title ?? null,
    format: String(row.variant.format),
  };
}

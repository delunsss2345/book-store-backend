import { StockImportItemResponseDto } from '../dto';
import { StockImportListRow } from '../select';
import { Prisma } from '@prisma/client';

export function toDecimalNumber(value: Prisma.Decimal | number): number {
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

export function toStockImportItem(
  row: StockImportListRow,
): StockImportItemResponseDto {
  return {
    id: row.id,
    purchaseOrderId: row.purchaseOrderId ?? null,
    supplierId: row.supplierId.toString(),
    supplierName: row.supplier?.name ?? null,
    note: row.note ?? null,
    totalAmount: toDecimalNumber(row.totalAmount),
    taxAmount: toDecimalNumber(row.taxAmount),
    createdAt: row.createdAt,
  };
}

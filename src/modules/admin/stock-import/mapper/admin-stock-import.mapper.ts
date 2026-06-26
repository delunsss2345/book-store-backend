import { Prisma } from '@prisma/client';
import {
  AdminStockImportDetailResponseDto,
  AdminStockImportItemResponseDto,
} from '../../dto/response';
import { AdminStockImportDetailRow, AdminStockImportListRow } from '../select';

function toDecimalNumber(value: Prisma.Decimal | number): number {
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

export function toAdminStockImportItem(
  row: AdminStockImportListRow,
): AdminStockImportItemResponseDto {
  return {
    id: row.id,
    purchaseOrderId: row.purchaseOrderId ?? null,
    supplierId: row.supplierId.toString(),
    supplierName: row.supplier?.name ?? null,
    note: row.note ?? null,
    totalAmount: toDecimalNumber(row.totalAmount),
    taxAmount: toDecimalNumber(row.taxAmount),
    creator: row.creator
      ? {
          firstName: row.creator.firstName ?? null,
          lastName: row.creator.lastName ?? null,
        }
      : null,
    createdAt: row.createdAt,
  };
}

export function toAdminStockImportDetail(
  row: AdminStockImportDetailRow,
): AdminStockImportDetailResponseDto {
  return {
    ...toAdminStockImportItem(row),
    items: row.items.map((item) => ({
      id: item.id,
      bookVariantId: item.bookVariantId.toString(),
      quantity: item.quantity,
      importPrice: toDecimalNumber(item.importPrice),
    })),
  };
}

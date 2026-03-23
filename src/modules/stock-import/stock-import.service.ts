import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  GetStockImportsQueryDto,
  StockImportItemResponseDto,
  StockImportListResponseDto,
} from './dto';
import { StockImportRepository } from './stock-import.repository';

type StockImportListRow = Awaited<
  ReturnType<StockImportRepository['findStockImports']>
>[number];

@Injectable()
export class StockImportService {
  constructor(private readonly stockImportRepository: StockImportRepository) {}

  async getStockImports(
    query: GetStockImportsQueryDto,
  ): Promise<StockImportListResponseDto> {
    const { page, limit, offset } = getPaginationParams(query.page, query.limit);

    const [total, items] = await Promise.all([
      this.stockImportRepository.findCountStockImports(query),
      this.stockImportRepository.findStockImports({
        ...query,
        page,
        limit,
        offset,
      }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.toStockImportItem(item)),
      total,
      page,
      limit,
    );
  }

  private toStockImportItem(row: StockImportListRow): StockImportItemResponseDto {
    return {
      id: row.id,
      purchaseOrderId: row.purchaseOrderId ?? null,
      supplierId: row.supplierId.toString(),
      supplierName: row.supplier?.name ?? null,
      note: row.note ?? null,
      totalAmount: this.toDecimalNumber(row.totalAmount),
      taxAmount: this.toDecimalNumber(row.taxAmount),
      createdAt: row.createdAt,
    };
  }

  private toDecimalNumber(value: Prisma.Decimal | number): number {
    return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  }
}

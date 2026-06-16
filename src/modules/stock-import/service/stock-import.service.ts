import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { Injectable } from '@nestjs/common';
import { GetStockImportsQueryDto, StockImportListResponseDto } from '../dto';
import { toStockImportItem } from '../mapper';
import { StockImportRepository } from '../repository/stock-import.repository';

@Injectable()
export class StockImportService {
  constructor(private readonly stockImportRepository: StockImportRepository) { }

  async getStockImports(
    query: GetStockImportsQueryDto,
  ): Promise<StockImportListResponseDto> {
    const { page, limit, offset } = getPaginationParams(
      query.page,
      query.limit,
    );

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
      items.map((item) => toStockImportItem(item)),
      total,
      page,
      limit,
    );
  }

  // Cho phép domain khác (vd PurchaseOrderService) tạo stock import qua service thay vì repository.
  // Nhận tx để giữ nguyên transaction của bên gọi.
  createStockImportFromPurchaseOrder(
    params: Parameters<
      StockImportRepository['createStockImportFromPurchaseOrder']
    >[0],
    tx?: Parameters<
      StockImportRepository['createStockImportFromPurchaseOrder']
    >[1],
  ) {
    return this.stockImportRepository.createStockImportFromPurchaseOrder(
      params,
      tx,
    );
  }

  createStockImportItemsFromPurchaseOrder(
    stockImportId: Parameters<
      StockImportRepository['createStockImportItemsFromPurchaseOrder']
    >[0],
    items: Parameters<
      StockImportRepository['createStockImportItemsFromPurchaseOrder']
    >[1],
    tx?: Parameters<
      StockImportRepository['createStockImportItemsFromPurchaseOrder']
    >[2],
  ) {
    return this.stockImportRepository.createStockImportItemsFromPurchaseOrder(
      stockImportId,
      items,
      tx,
    );
  }
}

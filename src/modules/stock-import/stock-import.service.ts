import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { Injectable } from '@nestjs/common';
import { GetStockImportsQueryDto, StockImportListResponseDto } from './dto';
import { toStockImportItem } from './mapper';
import { StockImportRepository } from './stock-import.repository';

@Injectable()
export class StockImportService {
  constructor(private readonly stockImportRepository: StockImportRepository) {}

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
}

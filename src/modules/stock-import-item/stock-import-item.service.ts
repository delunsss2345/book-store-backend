import { StockImportItemMessage } from '@/common';
import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  GetStockImportItemsQueryDto,
  StockImportItemListResponseDto,
} from './dto';
import { toStockImportItemDetail } from './mapper';
import { StockImportItemRepository } from './stock-import-item.repository';

@Injectable()
export class StockImportItemService {
  constructor(
    private readonly stockImportItemRepository: StockImportItemRepository,
  ) {}

  async getStockImportItemsByStockImportId(
    stockImportId: string,
    query: GetStockImportItemsQueryDto,
    langId: number,
  ): Promise<StockImportItemListResponseDto> {
    const stockImport =
      await this.stockImportItemRepository.findStockImportById(stockImportId);

    if (!stockImport) {
      throw new NotFoundException(
        StockImportItemMessage.STOCK_IMPORT_NOT_FOUND,
      );
    }

    const { page, limit, offset } = getPaginationParams(
      query.page,
      query.limit,
    );
    const [total, items] = await Promise.all([
      this.stockImportItemRepository.findCountStockImportItems(stockImportId),
      this.stockImportItemRepository.findStockImportItemsByStockImportId({
        stockImportId,
        languageId: langId,
        limit,
        offset,
      }),
    ]);

    return buildPaginatedResult(
      items.map((item) => toStockImportItemDetail(item)),
      total,
      page,
      limit,
    );
  }
}

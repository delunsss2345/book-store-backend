import { StockImportItemMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminStockImportListQueryDto } from '../dto/request';
import {
  AdminStockImportDetailResponseDto,
  AdminStockImportListResponseDto,
} from '../dto/response';
import { toAdminStockImportDetail, toAdminStockImportItem } from './mapper';
import { AdminStockImportRepository } from './admin-stock-import.repository';

@Injectable()
export class AdminStockImportService {
  constructor(
    private readonly adminStockImportRepository: AdminStockImportRepository,
  ) {}

  async getStockImports(
    query: AdminStockImportListQueryDto,
  ): Promise<AdminStockImportListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminStockImportRepository.countStockImports(),
      this.adminStockImportRepository.findStockImports(page, limit),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toAdminStockImportItem(row)),
      total,
      page,
      limit,
    );
  }

  async getStockImportDetail(
    stockImportId: string,
  ): Promise<AdminStockImportDetailResponseDto> {
    const row =
      await this.adminStockImportRepository.findStockImportById(stockImportId);

    if (!row) {
      throw new NotFoundException(
        StockImportItemMessage.STOCK_IMPORT_NOT_FOUND,
      );
    }

    return toAdminStockImportDetail(row);
  }
}

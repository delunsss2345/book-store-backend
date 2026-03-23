import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { LanguageService } from '@/modules/language/language.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  GetStockImportItemsQueryDto,
  StockImportItemDetailResponseDto,
  StockImportItemListResponseDto,
} from './dto';
import { StockImportItemRepository } from './stock-import-item.repository';

type StockImportItemRow = Awaited<
  ReturnType<StockImportItemRepository['findStockImportItemsByStockImportId']>
>[number];

@Injectable()
export class StockImportItemService {
  constructor(
    private readonly stockImportItemRepository: StockImportItemRepository,
    private readonly languageService: LanguageService,
  ) {}

  async getStockImportItemsByStockImportId(
    stockImportId: string,
    query: GetStockImportItemsQueryDto,
    lang: string,
  ): Promise<StockImportItemListResponseDto> {
    const [stockImport, language] = await Promise.all([
      this.stockImportItemRepository.findStockImportById(stockImportId),
      this.languageService.resolveLanguage(lang),
    ]);

    if (!stockImport) {
      throw new NotFoundException('Stock import not found');
    }

    const { page, limit, offset } = getPaginationParams(query.page, query.limit);
    const [total, items] = await Promise.all([
      this.stockImportItemRepository.findCountStockImportItems(stockImportId),
      this.stockImportItemRepository.findStockImportItemsByStockImportId({
        stockImportId,
        languageId: language.id,
        limit,
        offset,
      }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.toStockImportItemDetail(item)),
      total,
      page,
      limit,
    );
  }

  private toStockImportItemDetail(
    row: StockImportItemRow,
  ): StockImportItemDetailResponseDto {
    return {
      id: row.id,
      stockImportId: row.stockImportId,
      bookVariantId: row.bookVariantId.toString(),
      quantity: row.quantity,
      importPrice: this.toDecimalNumber(row.importPrice),
      title: row.variant.book.translations[0]?.title ?? null,
      format: String(row.variant.format),
    };
  }

  private toDecimalNumber(value: Prisma.Decimal | number) {
    return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  }
}

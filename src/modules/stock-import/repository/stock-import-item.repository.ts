import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { buildStockImportItemSelect } from '../select';

@Injectable()
export class StockImportItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  findStockImportById(stockImportId: string) {
    return this.prisma.stockImport.findUnique({
      where: { id: stockImportId },
      select: {
        id: true,
      },
    });
  }

  findCountStockImportItems(stockImportId: string) {
    return this.prisma.stockImportItem.count({
      where: { stockImportId },
    });
  }

  findStockImportItemsByStockImportId(params: {
    stockImportId: string;
    languageId: number;
    limit: number;
    offset: number;
  }) {
    const { stockImportId, languageId, limit, offset } = params;

    return this.prisma.stockImportItem.findMany({
      where: { stockImportId },
      take: limit,
      skip: offset,
      select: buildStockImportItemSelect(languageId),
      orderBy: [{ id: 'asc' }],
    });
  }
}

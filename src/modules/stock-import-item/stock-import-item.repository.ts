import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

const stockImportItemSelect = {
  id: true,
  stockImportId: true,
  bookVariantId: true,
  quantity: true,
  importPrice: true,
  variant: {
    select: {
      format: true,
      book: {
        select: {
          translations: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  },
};

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
      select: {
        ...stockImportItemSelect,
        variant: {
          select: {
            format: true,
            book: {
              select: {
                translations: {
                  where: { languageId },
                  take: 1,
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ id: 'asc' }],
    });
  }
}

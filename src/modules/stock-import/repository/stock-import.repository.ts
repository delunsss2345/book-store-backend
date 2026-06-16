import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetStockImportsQueryDto } from '../dto';
import { stockImportListSelect } from '../select';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class StockImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  createStockImportFromPurchaseOrder(
    params: {
      purchaseOrderId: string;
      supplierId: bigint;
      createdById: bigint;
      note?: string | null;
      totalAmount: number;
      taxAmount: number;
    },
    tx?: DbClient,
  ) {
    const db = this.getDb(tx);

    return db.stockImport.create({
      data: {
        purchaseOrderId: params.purchaseOrderId,
        supplierId: params.supplierId,
        createdBy: params.createdById,
        note: params.note ?? null,
        totalAmount: params.totalAmount,
        taxAmount: params.taxAmount,
      },
      select: {
        id: true,
      },
    });
  }

  createStockImportItemsFromPurchaseOrder(
    stockImportId: string,
    items: Array<{
      bookVariantId: bigint;
      quantity: number;
      importPrice: number;
    }>,
    tx?: DbClient,
  ) {
    if (!items.length) {
      return Promise.resolve({ count: 0 });
    }

    const db = this.getDb(tx);

    return db.stockImportItem.createMany({
      data: items.map((item) => ({
        stockImportId,
        bookVariantId: item.bookVariantId,
        quantity: item.quantity,
        importPrice: item.importPrice,
      })),
    });
  }

  findCountStockImports(_query?: GetStockImportsQueryDto) {
    return this.prisma.stockImport.count();
  }

  findStockImports(query: { page: number; limit: number; offset: number }) {
    return this.prisma.stockImport.findMany({
      take: query.limit,
      skip: query.offset,
      select: stockImportListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  private getDb(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }
}

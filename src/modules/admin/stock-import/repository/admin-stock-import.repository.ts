import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  adminStockImportDetailSelect,
  adminStockImportListSelect,
} from '../select';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AdminStockImportRepository {
  constructor(private readonly prisma: PrismaService) { }

  countStockImports() {
    return this.prisma.stockImport.count();
  }

  findStockImports(page: number, limit: number) {
    return this.prisma.stockImport.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: adminStockImportListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  findStockImportById(purchaseOrderId: string, tx?: DbClient) {
    const db = tx ?? this.prisma;
    return db.stockImport.findUnique({
      where: { purchaseOrderId },
      select: adminStockImportDetailSelect,
    });
  }

  findPurchaseOrderItemsByIds(ids: string[], tx?: DbClient) {
    const db = tx ?? this.prisma;
    return db.purchaseOrderItem.findMany({
      where: { id: { in: ids } },
      select: { id: true, bookVariantId: true, quantity: true, price: true },
    });
  }

  createStockImport(
    params: {
      purchaseOrderId: string;
      createdBy: number;
      note?: string | null;
      totalAmount: number;
    },
    tx?: DbClient,
  ) {
    const db = tx ?? this.prisma;
    return db.stockImport.create({
      data: {
        purchaseOrderId: params.purchaseOrderId,
        createdBy: params.createdBy,
        note: params.note ?? null,
        totalAmount: params.totalAmount,
      },
      select: { id: true },
    });
  }

  createStockImportItems(
    stockImportId: string,
    items: {
      purchaseOrderItemId: string;
      realQuantity: number;
      lackQuantity: number;
      totalPrice: number;
    }[],
    tx?: DbClient,
  ) {
    const db = tx ?? this.prisma;
    return db.stockImportItem.createMany({
      data: items.map((item) => ({ stockImportId, ...item })),
    });
  }
}

import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import {
  adminStockImportDetailSelect,
  adminStockImportListSelect,
} from './select';

@Injectable()
export class AdminStockImportRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  findStockImportById(stockImportId: string) {
    return this.prisma.stockImport.findUnique({
      where: { id: stockImportId },
      select: adminStockImportDetailSelect,
    });
  }
}

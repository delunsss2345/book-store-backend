import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StockImportRepository {
  constructor(private readonly prisma: PrismaService) {}
}

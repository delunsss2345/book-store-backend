import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StockImportItemRepository {
  constructor(private readonly prisma: PrismaService) {}
}

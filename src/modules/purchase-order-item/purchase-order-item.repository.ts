import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchaseOrderItemRepository {
  constructor(private readonly prisma: PrismaService) {}
}

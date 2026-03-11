import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) {}
}

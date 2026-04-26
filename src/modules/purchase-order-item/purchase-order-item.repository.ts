import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { CreatePurchaseOrderRequestDto } from '../purchase-order/dto';

@Injectable()
export class PurchaseOrderItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPurchaseOrderItems(
    purchaseOrderId: string,
    body: CreatePurchaseOrderRequestDto,
  ) {
    throw new Error('Method not implemented.');
  }

  findPurchaseOrderItemsByPurchaseOrderId(purchaseOrderId: string) {
    throw new Error('Method not implemented.');
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CreatePurchaseOrderItemInput,
  PurchaseOrderItemRepository,
} from '../repository/purchase-order-item.repository';

@Injectable()
export class PurchaseOrderItemService {
  constructor(
    private readonly purchaseOrderItemRepository: PurchaseOrderItemRepository,
  ) { }

  createPurchaseOrderItems(
    purchaseOrderId: string,
    items: CreatePurchaseOrderItemInput[],
    tx?: Prisma.TransactionClient,
  ) {
    return this.purchaseOrderItemRepository.createPurchaseOrderItems(
      purchaseOrderId,
      items,
      tx,
    );
  }

  getPurchaseOrderItemsByPurchaseOrderId(purchaseOrderId: string) {
    return this.purchaseOrderItemRepository.findPurchaseOrderItemsByPurchaseOrderId(
      purchaseOrderId,
    );
  }
}

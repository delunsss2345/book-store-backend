import { Injectable } from '@nestjs/common';
import { CreatePurchaseOrderRequestDto } from '../dto';
import { PurchaseOrderItemRepository } from '../repository/purchase-order-item.repository';

@Injectable()
export class PurchaseOrderItemService {
  constructor(
    private readonly purchaseOrderItemRepository: PurchaseOrderItemRepository,
  ) { }

  createPurchaseOrderItems(
    purchaseOrderId: string,
    body: CreatePurchaseOrderRequestDto,
  ) {
    throw new Error('Method not implemented.');
  }

  getPurchaseOrderItemsByPurchaseOrderId(purchaseOrderId: string) {
    throw new Error('Method not implemented.');
  }
}

import { Injectable } from '@nestjs/common';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrdersQueryDto,
} from './dto';
import { PurchaseOrderRepository } from './purchase-order.repository';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  createPurchaseOrder(createdById: bigint, body: CreatePurchaseOrderRequestDto) {
    throw new Error('Method not implemented.');
  }

  getPurchaseOrders(query: GetPurchaseOrdersQueryDto) {
    throw new Error('Method not implemented.');
  }

  getPurchaseOrderDetail(purchaseOrderId: string) {
    throw new Error('Method not implemented.');
  }

  approvePurchaseOrder(
    purchaseOrderId: string,
    approvedById: bigint,
    body?: ApprovePurchaseOrderRequestDto,
  ) {
    throw new Error('Method not implemented.');
  }
}

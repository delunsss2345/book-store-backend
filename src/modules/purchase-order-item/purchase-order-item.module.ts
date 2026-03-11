import { Module } from '@nestjs/common';
import { PurchaseOrderItemRepository } from './purchase-order-item.repository';

@Module({
  providers: [PurchaseOrderItemRepository],
  exports: [PurchaseOrderItemRepository],
})
export class PurchaseOrderItemModule {}

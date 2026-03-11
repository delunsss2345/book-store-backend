import { Module } from '@nestjs/common';
import { PurchaseOrderRepository } from './purchase-order.repository';

@Module({
  providers: [PurchaseOrderRepository],
  exports: [PurchaseOrderRepository],
})
export class PurchaseOrderModule {}

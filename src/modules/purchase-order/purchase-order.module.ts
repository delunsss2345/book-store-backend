import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderRepository } from './purchase-order.repository';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderRepository, PurchaseOrderService],
  exports: [PurchaseOrderRepository, PurchaseOrderService],
})
export class PurchaseOrderModule {}

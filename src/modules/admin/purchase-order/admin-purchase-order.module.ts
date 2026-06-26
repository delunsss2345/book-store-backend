import { BookVariantModule } from '@/modules/book/variant';
import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './controller/purchase-order.controller';
import { PurchaseOrderItemRepository } from './repository/purchase-order-item.repository';
import { PurchaseOrderRepository } from './repository/purchase-order.repository';
import { PurchaseOrderItemService } from './service/purchase-order-item.service';
import { PurchaseOrderService } from './service/purchase-order.service';

@Module({
  imports: [BookVariantModule],
  controllers: [PurchaseOrderController],
  providers: [
    PurchaseOrderRepository,
    PurchaseOrderItemRepository,
    PurchaseOrderService,
    PurchaseOrderItemService,
  ],
  exports: [
    PurchaseOrderRepository,
    PurchaseOrderItemRepository,
    PurchaseOrderService,
    PurchaseOrderItemService,
  ],
})
export class AdminPurchaseOrderModule { }

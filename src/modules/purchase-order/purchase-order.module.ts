import { BookVariantModule } from '@/modules/book/variant';
import { StockImportModule } from '@/modules/stock-import';
import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './controller/purchase-order.controller';
import { PurchaseOrderItemRepository } from './repository/purchase-order-item.repository';
import { PurchaseOrderRepository } from './repository/purchase-order.repository';
import { PurchaseOrderItemService } from './service/purchase-order-item.service';
import { PurchaseOrderService } from './service/purchase-order.service';

@Module({
  imports: [StockImportModule, BookVariantModule],
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
export class PurchaseOrderModule { }

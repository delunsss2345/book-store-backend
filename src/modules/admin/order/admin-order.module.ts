import { Module } from '@nestjs/common';
import { AdminOrderDetailController } from './controller/admin-order-detail.controller';
import { AdminOrderController } from './controller/admin-order.controller';
import { AdminOrderRepository } from './repository/admin-order.repository';
import { AdminOrderService } from './service/admin-order.service';

@Module({
  controllers: [AdminOrderController, AdminOrderDetailController],
  providers: [AdminOrderService, AdminOrderRepository],
  exports: [AdminOrderService, AdminOrderRepository],
})
export class AdminOrderModule { }

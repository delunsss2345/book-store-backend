import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrdersQueryDto,
} from './dto';
import { PurchaseOrderService } from './purchase-order.service';

@ApiTags('purchase-orders')
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  createPurchaseOrder(@Body() body: CreatePurchaseOrderRequestDto) {
    throw new Error('Method not implemented.');
  }

  @Get()
  getPurchaseOrders(@Query() query: GetPurchaseOrdersQueryDto) {
    throw new Error('Method not implemented.');
  }

  @Get(':purchaseOrderId')
  getPurchaseOrderDetail(@Param('purchaseOrderId') purchaseOrderId: string) {
    throw new Error('Method not implemented.');
  }

  @Post(':purchaseOrderId/approve')
  approvePurchaseOrder(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: ApprovePurchaseOrderRequestDto,
  ) {
    throw new Error('Method not implemented.');
  }
}

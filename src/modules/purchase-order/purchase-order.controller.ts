import type { JwtPayload } from '@/common';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrdersQueryDto,
} from './dto';
import { PurchaseOrderService } from './purchase-order.service';

@ApiTags('purchase-orders')
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) { }

  @Post()
  @ApiBearerAuth('access-token')
  createPurchaseOrder(
    @Body() body: CreatePurchaseOrderRequestDto,
    @GetUser() user: JwtPayload,
  ) {
    ;
    const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
    return this.purchaseOrderService.createPurchaseOrder(actorUserId, body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  getPurchaseOrders(@Query() query: GetPurchaseOrdersQueryDto) {
    console.log('Get purchase orders with query:', query);
    return this.purchaseOrderService.getPurchaseOrders(query);
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

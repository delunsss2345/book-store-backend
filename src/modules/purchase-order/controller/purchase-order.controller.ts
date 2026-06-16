import type { JwtPayload } from '@/common';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrderItemsQueryDto,
  GetPurchaseOrdersQueryDto,
} from '../dto';
import { PurchaseOrderService } from '../service/purchase-order.service';

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
    const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
    return this.purchaseOrderService.createPurchaseOrder(actorUserId, body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  async getPurchaseOrders(@Query() query: GetPurchaseOrdersQueryDto) {
    return this.purchaseOrderService.getPurchaseOrders(query);
  }

  @Get(':purchaseOrderId')
  @ApiBearerAuth('access-token')
  getPurchaseOrderDetail(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Query() query: GetPurchaseOrderItemsQueryDto,
    @GetLanguageId() langId: number,
  ) {
    return this.purchaseOrderService.getPurchaseOrderDetail(
      purchaseOrderId,
      query,
      langId,
    );
  }

  @Post(':purchaseOrderId/approve')
  approvePurchaseOrder(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: ApprovePurchaseOrderRequestDto,
    @GetUser() user: JwtPayload,
  ) {
    const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
    return this.purchaseOrderService.approvePurchaseOrder(
      purchaseOrderId,
      actorUserId,
      body,
    );

  }
}

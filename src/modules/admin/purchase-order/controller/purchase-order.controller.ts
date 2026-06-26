import type { JwtPayload } from '@/common';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrderItemsQueryDto,
  GetPurchaseOrdersQueryDto,
  PurchaseOrderItemResponseDto,
  PurchaseOrderListResponseDto,
} from '../dto';
import { PurchaseOrderService } from '../service/purchase-order.service';

@ApiTags('purchase-orders')
@Controller('purchase-orders')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) { }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiCreatedResponse({ type: Object, description: 'Purchase order created successfully' })
  createPurchaseOrder(
    @Body() body: CreatePurchaseOrderRequestDto,
    @GetUser() user: JwtPayload,
  ) {
    const actorUserId = Number(user?.sub);
    return this.purchaseOrderService.createPurchaseOrder(actorUserId, body);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get list of purchase orders' })
  @ApiOkResponse({ type: PurchaseOrderListResponseDto, description: 'List of purchase orders' })
  async getPurchaseOrders(@Query() query: GetPurchaseOrdersQueryDto) {
    return this.purchaseOrderService.getPurchaseOrders(query);
  }

  @Get(':purchaseOrderId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get purchase order detail by ID' })
  @ApiParam({ name: 'purchaseOrderId', type: String, description: 'Purchase order ID' })
  @ApiOkResponse({ type: PurchaseOrderItemResponseDto, description: 'Purchase order detail' })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Approve or reject a purchase order' })
  @ApiParam({ name: 'purchaseOrderId', type: String, description: 'Purchase order ID' })
  @ApiCreatedResponse({ type: Object, description: 'Purchase order approval result' })
  approvePurchaseOrder(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: ApprovePurchaseOrderRequestDto,
    @GetUser() user: JwtPayload,
  ) {
    const actorUserId = Number(user?.sub);
    return this.purchaseOrderService.approvePurchaseOrder(
      purchaseOrderId,
      actorUserId,
      body,
    );
  }

  @Post(':purchaseOrderId/transfer-processing')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update purchase order status to transfer processing' })
  @ApiParam({ name: 'purchaseOrderId', type: String, description: 'Purchase order ID' })
  @ApiCreatedResponse({ type: Object, description: 'Purchase order transfer processing status updated' })
  updateStatusTransfer(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @GetUser() user: JwtPayload,
  ) {
    const actorUserId = Number(user?.sub);
    return this.purchaseOrderService.updateStatusTransfer(
      purchaseOrderId,
      actorUserId,
    );
  }
}

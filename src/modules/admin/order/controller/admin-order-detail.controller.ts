import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOrderDetailResponseDto } from '../dto/response';
import { AdminOrderService } from '../service/admin-order.service';

@ApiTags('admin')
@Controller('admin/order-details')
export class AdminOrderDetailController {
  constructor(private readonly adminOrderService: AdminOrderService) {}

  @Get(':orderId')
  @RequirePermissions(PermissionCode.ORDER_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get order detail by order ID' })
  @ApiParam({ name: 'orderId', type: Number, description: 'ID of the order' })
  @ApiOkResponse({ type: AdminOrderDetailResponseDto })
  getOrderDetail(@Param('orderId') orderId: string) {
    const parsedOrderId = Number(orderId);
    return this.adminOrderService.getOrderDetail(parsedOrderId);
  }
}

import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOrderListQueryDto, AdminOrderStatusDto } from '../dto/request';
import {
  AdminGuestOrderListResponseDto,
  AdminOrderStatusResponseDto,
  AdminUserOrderListResponseDto,
} from '../dto/response';
import { AdminOrderService } from '../service/admin-order.service';

@ApiTags('admin')
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly adminOrderService: AdminOrderService) {}

  @Get()
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated list of guest orders' })
  @ApiOkResponse({ type: AdminGuestOrderListResponseDto })
  getGuestOrders(@Query() query: AdminOrderListQueryDto) {
    return this.adminOrderService.getGuestOrders(query);
  }

  @Get('/user')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated list of registered user orders' })
  @ApiOkResponse({ type: AdminUserOrderListResponseDto })
  getUserOrders(@Query() query: AdminOrderListQueryDto) {
    return this.adminOrderService.getUserOrders(query);
  }

  @Patch(':orderId/status')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update the status of an order' })
  @ApiParam({ name: 'orderId', type: 'string', description: 'Order ID' })
  @ApiOkResponse({ type: AdminOrderStatusResponseDto })
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: AdminOrderStatusDto,
  ) {
    const parsedOrderId = Number(orderId);
    return this.adminOrderService.updateOrderStatus(parsedOrderId, body);
  }
}

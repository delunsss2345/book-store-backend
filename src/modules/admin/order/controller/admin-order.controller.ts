import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOkResponse({ type: AdminGuestOrderListResponseDto })
  getGuestOrders(@Query() query: AdminOrderListQueryDto) {
    return this.adminOrderService.getGuestOrders(query);
  }

  @Get('/user')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminUserOrderListResponseDto })
  getUserOrders(@Query() query: AdminOrderListQueryDto) {
    return this.adminOrderService.getUserOrders(query);
  }

  @Patch(':orderId/status')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminOrderStatusResponseDto })
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: AdminOrderStatusDto,
  ) {
    const parsedOrderId = Number(orderId);
    return this.adminOrderService.updateOrderStatus(parsedOrderId, body);
  }
}

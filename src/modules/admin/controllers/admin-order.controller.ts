import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminOrderListQueryDto } from '../dto/request';
import {
  AdminGuestOrderListResponseDto,
  AdminUserOrderListResponseDto,
} from '../dto/response';
import { AdminOrderService } from '../order/admin-order.service';

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
}

import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminOrderService } from '../order/admin-order.service';
import { AdminOrderListQueryDto } from '../dto/request';
import { AdminOrderListResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly adminOrderService: AdminOrderService) {}

  @Get()
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminOrderListResponseDto })
  getOrders(@Query() query: AdminOrderListQueryDto) {
    return this.adminOrderService.getOrders(query);
  }
}

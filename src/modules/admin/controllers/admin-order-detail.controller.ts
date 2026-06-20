import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminOrderDetailResponseDto } from '../dto/response';
import { AdminOrderService } from '../order/admin-order.service';

@ApiTags('admin')
@Controller('admin/order-details')
export class AdminOrderDetailController {
  constructor(private readonly adminOrderService: AdminOrderService) { }

  @Get(':orderId')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @Public()
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminOrderDetailResponseDto })
  getOrderDetail(@Param('orderId') orderId: string) {
    const parsedOrderId = Number(orderId);
    return this.adminOrderService.getOrderDetail(parsedOrderId);
  }
}

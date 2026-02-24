import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { AdminOrderDetailResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/order-details')
export class AdminOrderDetailController {
    constructor(private readonly adminService: AdminService) { }

    @Get(':orderId')
    @RequirePermissions(PermissionCode.ADMIN_READ)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: AdminOrderDetailResponseDto })
    getOrderDetail(@Param('orderId') orderId: string) {
        const parsedOrderId = parseBigIntRequired(orderId, 'orderId');
        return this.adminService.getOrderDetail(parsedOrderId);
    }
}

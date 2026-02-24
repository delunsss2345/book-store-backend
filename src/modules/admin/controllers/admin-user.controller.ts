import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { AdminUserListQueryDto } from '../dto/request';
import { AdminUserListResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/users')
export class AdminUserController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @RequirePermissions(PermissionCode.ADMIN_READ)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: AdminUserListResponseDto })
    getUsers(@Query() query: AdminUserListQueryDto) {
        return this.adminService.getUsers(query);
    }

    @Get('non-customer')
    @RequirePermissions(PermissionCode.ADMIN_READ)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: AdminUserListResponseDto })
    getNonCustomerUsers(@Query() query: AdminUserListQueryDto) {
        return this.adminService.getNonCustomerUsers(query);
    }
}

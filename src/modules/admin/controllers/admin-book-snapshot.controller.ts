import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import { AdminBookSnapshotListQueryDto } from '../dto/request';
import { AdminBookSnapshotListResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/book-snapshots')
export class AdminBookSnapshotController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    @RequirePermissions(PermissionCode.ADMIN_READ)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: AdminBookSnapshotListResponseDto })
    getBookSnapshots(@Query() query: AdminBookSnapshotListQueryDto) {
        return this.adminService.getBookSnapshots(query);
    }
}

import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminBookService } from '../book/admin-book.service';
import { AdminBookSnapshotListQueryDto } from '../dto/request';
import { AdminBookSnapshotListResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/book-snapshots')
export class AdminBookSnapshotController {
  constructor(private readonly adminBookService: AdminBookService) {}

  @Get()
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookSnapshotListResponseDto })
  getBookSnapshots(@Query() query: AdminBookSnapshotListQueryDto) {
    return this.adminBookService.getBookSnapshots(query);
  }
}

import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminCategoryService } from '../categories/admin-category.service';
import { AdminCategoryStatsResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly adminCategoryService: AdminCategoryService) { }

  @Get('stats')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminCategoryStatsResponseDto })
  getStats() {
    return this.adminCategoryService.getStats();
  }
}

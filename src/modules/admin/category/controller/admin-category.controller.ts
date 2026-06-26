import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminCategoryStatsResponseDto } from '../dto/response/admin-category-stats.response.dto';
import { AdminCategoryService } from '../service/admin-category.service';

@ApiTags('admin')
@Controller('admin/categories')
export class AdminCategoryController {
  constructor(private readonly adminCategoryService: AdminCategoryService) { }

  @Get('stats')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiOkResponse({ type: AdminCategoryStatsResponseDto })
  getStats() {
    return this.adminCategoryService.getStats();
  }
}

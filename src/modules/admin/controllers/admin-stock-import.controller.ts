import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminStockImportListQueryDto } from '../dto/request';
import {
  AdminStockImportDetailResponseDto,
  AdminStockImportListResponseDto,
} from '../dto/response';
import { AdminStockImportService } from '../stock-import/admin-stock-import.service';

@ApiTags('admin')
@Controller('admin/stock-imports')
export class AdminStockImportController {
  constructor(
    private readonly adminStockImportService: AdminStockImportService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminStockImportListResponseDto })
  getStockImports(@Query() query: AdminStockImportListQueryDto) {
    return this.adminStockImportService.getStockImports(query);
  }

  @Get(':stockImportId')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminStockImportDetailResponseDto })
  getStockImportDetail(@Param('stockImportId') stockImportId: string) {
    return this.adminStockImportService.getStockImportDetail(stockImportId);
  }
}

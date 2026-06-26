import type { JwtPayload } from '@/common';
import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminStockImportListQueryDto,
  CreateAdminStockImportRequestDto,
} from '../dto/request';
import {
  AdminStockImportDetailResponseDto,
  AdminStockImportListResponseDto,
} from '../dto/response';
import { AdminStockImportService } from '../service/admin-stock-import.service';

@ApiTags('admin')
@Controller('admin/stock-imports')
export class AdminStockImportController {
  constructor(
    private readonly adminStockImportService: AdminStockImportService,
  ) { }

  @Post("/create")
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new stock import record' })
  @ApiBody({ type: CreateAdminStockImportRequestDto })
  @ApiCreatedResponse({ type: AdminStockImportDetailResponseDto })
  createStockImport(
    @Body() body: CreateAdminStockImportRequestDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.adminStockImportService.createStockImport(
      Number(user.sub),
      body,
    );
  }

  @Get()
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated list of stock imports' })
  @ApiOkResponse({ type: AdminStockImportListResponseDto })
  getStockImports(@Query() query: AdminStockImportListQueryDto) {
    return this.adminStockImportService.getStockImports(query);
  }

  @Get('/:purchaseOrderId')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get stock import detail by purchase order ID' })
  @ApiParam({ name: 'purchaseOrderId', type: String, description: 'Purchase order ID' })
  @ApiOkResponse({ type: AdminStockImportDetailResponseDto })
  getStockImportDetail(@Param('purchaseOrderId') purchaseOrderId: string) {
    return this.adminStockImportService.getStockImportDetail(purchaseOrderId);
  }
}

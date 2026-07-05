import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { PermissionsGuard } from '@/common/security/guard/permission.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger';
import { CreateSupplierRequestDto } from '../dto/request/create-supplier.request.dto';
import { GetSuppliersQueryDto } from '../dto/request/get-suppliers.query.dto';
import { SupplierItemResponseDto } from '../dto/response/supplier-item.response.dto';
import { SupplierListResponseDto } from '../dto/response/supplier-list.response.dto';
import { SupplierService } from '../service/supplier.service';

@ApiTags('supplier')
@Controller('suppliers')
@UseGuards(PermissionsGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) { }

  @Get()
  @RequirePermissions(PermissionCode.SUPPLIER_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated list of suppliers' })
  @ApiOkResponse({ type: SupplierListResponseDto })
  getSuppliers(@Query() query: GetSuppliersQueryDto) {
    return this.supplierService.getSuppliers(query);
  }

  @Post()
  @RequirePermissions(PermissionCode.SUPPLIER_CREATE)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiBody({ type: CreateSupplierRequestDto })
  @ApiCreatedResponse({ type: SupplierItemResponseDto })
  createSupplier(@Body() body: CreateSupplierRequestDto) {
    return this.supplierService.createSupplier(body);
  }

  @Patch(':supplierId/active')
  @RequirePermissions(PermissionCode.SUPPLIER_UPDATE)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle active status of a supplier' })
  @ApiParam({ name: 'supplierId', type: Number, description: 'ID of the supplier' })
  @ApiOkResponse({ type: SupplierItemResponseDto })
  toggleSupplierActive(@Param('supplierId') supplierId: string) {
    return this.supplierService.toggleSupplierActive(
      Number(supplierId),
    );
  }
}

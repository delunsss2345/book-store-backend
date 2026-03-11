import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateSupplierRequestDto } from './dto/request/create-supplier.request.dto';
import { GetSuppliersQueryDto } from './dto/request/get-suppliers.query.dto';
import { SupplierItemResponseDto } from './dto/response/supplier-item.response.dto';
import { SupplierListResponseDto } from './dto/response/supplier-list.response.dto';
import { SupplierService } from './supplier.service';

@ApiTags('supplier')
@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  // @RequirePermissions(PermissionCode.SUPPLIER_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: SupplierListResponseDto })
  getSuppliers(@Query() query: GetSuppliersQueryDto) {
    return this.supplierService.getSuppliers(query);
  }

  @Post()
  @RequirePermissions(PermissionCode.SUPPLIER_CREATE)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: SupplierItemResponseDto })
  createSupplier(@Body() body: CreateSupplierRequestDto) {
    return this.supplierService.createSupplier(body);
  }

  @Patch(':supplierId/active')
  @RequirePermissions(PermissionCode.SUPPLIER_UPDATE)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: SupplierItemResponseDto })
  toggleSupplierActive(@Param('supplierId') supplierId: string) {
    return this.supplierService.toggleSupplierActive(
      parseBigIntRequired(supplierId, 'supplierId'),
    );
  }
}

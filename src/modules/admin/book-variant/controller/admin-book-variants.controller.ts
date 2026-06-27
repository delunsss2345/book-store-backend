import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { AdminUpdatePriceVariant } from '@/modules/admin/book-variant/dto/resquest/update-price-variant.resquest';
import { AdminBookListQueryDto } from '@/modules/admin/book/dto/request';
import { AdminBookListResponseDto } from '@/modules/admin/book/dto/response';
import { AdminBookVariantItemResponseDto } from '@/modules/admin/book/dto/response/admin-book-variant-item.response.dto';
import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Query
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { BookVariant } from '@prisma/client';
import { AdminBookVariantsService } from '../service/admin-book-variant.service';

@ApiTags('admin')
@Controller('admin/book-variants')
export class AdminBookVariantController {
    constructor(private readonly adminBookVariantService: AdminBookVariantsService) { }

    @Get()
    @RequirePermissions(PermissionCode.ADMIN_READ)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Get paginated list of book variants' })
    @ApiOkResponse({ type: AdminBookListResponseDto })
    getBookVariants(@Query() query: AdminBookListQueryDto, @GetLanguageId() langId: number) {
        return this.adminBookVariantService.getBookVariants(query, langId);
    }

    @Patch('/:variantId')
    @RequirePermissions(PermissionCode.ADMIN_READ)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update price of a book variant' })
    @ApiParam({ name: 'variantId', type: Number, description: 'Book variant ID' })
    @ApiBody({ type: AdminUpdatePriceVariant })
    @ApiOkResponse({ type: AdminBookVariantItemResponseDto })
    updatePrice(@Param('variantId') variantId, @Body() body: AdminUpdatePriceVariant): Promise<BookVariant> {
        return this.adminBookVariantService.updatePriceVariant(Number(variantId), body);
    }

}

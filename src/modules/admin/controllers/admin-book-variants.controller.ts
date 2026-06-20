import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { AdminBookVariantsService } from '@/modules/admin/book-variant/admin-book-variant.service';
import {
    Controller,
    Get,
    Query
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
    AdminBookListQueryDto
} from '../dto/request';
import {
    AdminBookListResponseDto
} from '../dto/response';

@ApiTags('admin')
@Controller('admin/book-variants')
export class AdminBookVariantController {
    constructor(private readonly adminBookVariantService: AdminBookVariantsService) { }

    @Get()
    @RequirePermissions(PermissionCode.ADMIN_READ)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: AdminBookListResponseDto })
    getBookVariants(@Query() query: AdminBookListQueryDto, @GetLanguageId() langId: number) {
        return this.adminBookVariantService.getBookVariants(query, langId);
    }

}

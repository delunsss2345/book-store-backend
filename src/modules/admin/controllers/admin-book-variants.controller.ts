import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { AdminBookVariantsService } from '@/modules/admin/bookVariant/admin-book-variant.service';
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
    getBookVariants(@Query() query: AdminBookListQueryDto, @GetLanguage() lang: string) {
        return this.adminBookVariantService.getBookVariants(query, lang);
    }

}

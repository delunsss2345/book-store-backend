import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoryService } from '../service/category.service';
import { CreateCategoryRequestDto } from '../dto/request/create-category.request.dto';
import { GetCategoriesQueryDto } from '../dto/request/get-categories.query.dto';
import { CategoryItemResponseDto } from '../dto/response/category-item.response.dto';
import { CategoryListResponseDto } from '../dto/response/category-list.response.dto';

@ApiTags('category')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @RequirePermissions(PermissionCode.CATEGORY_CREATE)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a new category' })
    @ApiBody({ type: CreateCategoryRequestDto })
    @ApiCreatedResponse({ type: CategoryItemResponseDto })
    createCategory(
        @Body() body: CreateCategoryRequestDto,
        @GetUser() user: JwtPayload,
        @GetLanguageId() langId: number,
    ) {
        const actorUserId = Number(user?.sub);
        return this.categoryService.createCategory(body, actorUserId, langId);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get paginated list of categories' })
    @ApiOkResponse({ type: CategoryListResponseDto })
    getCategories(@Query() query: GetCategoriesQueryDto, @GetLanguageId() langId: number) {
        return this.categoryService.getCategories(query, langId);
    }
}

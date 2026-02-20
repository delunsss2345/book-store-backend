import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateCategoryRequestDto } from './dto/request/create-category.request.dto';
import { GetCategoriesQueryDto } from './dto/request/get-categories.query.dto';
import { CategoryItemResponseDto } from './dto/response/category-item.response.dto';
import { CategoryListResponseDto } from './dto/response/category-list.response.dto';
import { CategoryService } from './category.service';

@ApiTags('category')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @RequirePermissions(PermissionCode.CATEGORY_CREATE)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: CategoryItemResponseDto })
    createCategory(@Body() body: CreateCategoryRequestDto, @GetUser() user: JwtPayload) {
        const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
        return this.categoryService.createCategory(body, actorUserId);
    }

    @Public()
    @Get()
    @ApiOkResponse({ type: CategoryListResponseDto })
    getCategories(@Query() query: GetCategoriesQueryDto) {
        return this.categoryService.getCategories(query);
    }
}

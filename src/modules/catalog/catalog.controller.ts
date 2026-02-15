import { Public } from '@/common/security/decorators/public.decorator';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import {
    CatalogBookListQueryDto,
    CatalogCategoriesQueryDto,
    CatalogHomeQueryDto
} from './dto/request';
import {
    CatalogBookDetailDto,
    CatalogBookListResponseDto,
    CatalogCategoryTreeDto,
    CatalogHomeResponseDto
} from './dto/response';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Public()
    @Get('home')
    @ApiOkResponse({ type: CatalogHomeResponseDto })
    getCatalogHome(@Query() query: CatalogHomeQueryDto) {
        return this.catalogService.getCatalogHome(query);
    }

    @Public()
    @Get('books')
    @ApiOkResponse({ type: CatalogBookListResponseDto })
    listBooks(@Query() query: CatalogBookListQueryDto) {
        return this.catalogService.listBooks(query);
    }

    @Public()
    @Get('books/:bookId')
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetail(
        @Param('bookId') bookId: string,
        @Query('lang') lang?: string,
    ) {
        return this.catalogService.getBookDetail(this.parseBigInt(bookId, 'bookId'), lang);
    }

    @Public()
    @Get('books/slug/:slug')
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetailBySlug(
        @Param('slug') slug: string,
        @Query('lang') lang?: string,
    ) {
        return this.catalogService.getBookDetailBySlug(slug, lang);
    }

    @Public()
    @Get('categories')
    @ApiOkResponse({ type: [CatalogCategoryTreeDto] })
    getCategories(@Query() query: CatalogCategoriesQueryDto) {
        return this.catalogService.getCategories(query.lang);
    }


    private parseBigInt(value: string | undefined, fieldName: string): bigint {
        if (!value) {
            throw new BadRequestException(`${fieldName} is required`);
        }

        try {
            return BigInt(value);
        } catch {
            throw new BadRequestException(`${fieldName} must be a bigint`);
        }
    }
}

import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Controller, Get, Param, Query } from '@nestjs/common';
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
    getCatalogHome(@Query() query: CatalogHomeQueryDto, @GetLanguage() lang: string) {
        const effectiveLang = query.lang ?? lang;
        return this.catalogService.getCatalogHome({ ...query, lang: effectiveLang });
    }

    @Public()
    @Get('books')
    @ApiOkResponse({ type: CatalogBookListResponseDto })
    listBooks(@Query() query: CatalogBookListQueryDto, @GetLanguage() lang: string) {
        const effectiveLang = query.lang ?? lang;
        return this.catalogService.listBooks({ ...query, lang: effectiveLang });
    }

    @Public()
    @Get('books/:bookId')
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetail(
        @Param('bookId') bookId: string,
        @Query('lang') lang?: string,
        @GetLanguage() language?: string,
    ) {
        const effectiveLang = lang ?? language;
        return this.catalogService.getBookDetail(parseBigIntRequired(bookId, 'bookId'), effectiveLang);
    }

    @Public()
    @Get('books/slug/:slug')
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetailBySlug(
        @Param('slug') slug: string,
        @Query('lang') lang?: string,
        @GetLanguage() language?: string,
    ) {
        const effectiveLang = lang ?? language;
        return this.catalogService.getBookDetailBySlug(slug, effectiveLang);
    }

    @Public()
    @Get('categories')
    @ApiOkResponse({ type: [CatalogCategoryTreeDto] })
    getCategories(@Query() query: CatalogCategoriesQueryDto, @GetLanguage() lang: string) {
        const effectiveLang = query.lang ?? lang;
        return this.catalogService.getCategories(effectiveLang);
    }
}

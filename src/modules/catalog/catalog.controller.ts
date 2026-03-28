import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import {
    CatalogBookListQueryDto,
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
    getCatalogHome(@Query() query: CatalogHomeQueryDto, @GetLanguageId() langId: number) {
        return this.catalogService.getCatalogHome(query, langId);
    }

    @Public()
    @Get('books')
    @ApiOkResponse({ type: CatalogBookListResponseDto })
    listBooks(@Query() query: CatalogBookListQueryDto, @GetLanguageId() langId: number) {
        return this.catalogService.listBooks(query, langId);
    }

    @Public()
    @Get('books/:bookId')
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetail(
        @Param('bookId') bookId: string,
        @GetLanguageId() langId: number,
    ) {
        return this.catalogService.getBookDetail(parseBigIntRequired(bookId, 'bookId'), langId);
    }

    @Public()
    @Get('books/slug/:slug')
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetailBySlug(
        @Param('slug') slug: string,
        @GetLanguageId() langId: number,
    ) {
        return this.catalogService.getBookDetailBySlug(slug, langId);
    }

    @Public()
    @Get('categories')
    @ApiOkResponse({ type: [CatalogCategoryTreeDto] })
    getCategories(@GetLanguageId() langId: number) {
        return this.catalogService.getCategories(langId);
    }
}

import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
    CatalogBookListQueryDto,
    CatalogHomeQueryDto
} from '../dto/request';
import {
    CatalogBookCardDto,
    CatalogBookDetailDto,
    CatalogBookListResponseDto,
    CatalogCategoryTreeDto,
} from '../dto/response';
import { CatalogService } from '../service/catalog.service';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Public()
    @Get('home')
    @ApiOperation({ summary: 'Get random catalog home books' })
    @ApiOkResponse({ type: CatalogBookCardDto, isArray: true })
    getCatalogHome(@Query() query: CatalogHomeQueryDto, @GetLanguageId() langId: number) {
        return this.catalogService.getCatalogHome(query, langId);
    }

    @Public()
    @Get('books')
    @ApiOperation({ summary: 'List books with filtering and pagination' })
    @ApiOkResponse({ type: CatalogBookListResponseDto })
    listBooks(@Query() query: CatalogBookListQueryDto, @GetLanguageId() langId: number) {
        return this.catalogService.listBooks(query, langId);
    }

    @Public()
    @Get('books/:bookId')
    @ApiOperation({ summary: 'Get book detail by book ID' })
    @ApiParam({ name: 'bookId', type: Number, description: 'The ID of the book' })
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetail(
        @Param('bookId') bookId: string,
        @GetLanguageId() langId: number,
    ) {
        return this.catalogService.getBookDetail(Number(bookId), langId);
    }

    @Public()
    @Get('books/slug/:slug')
    @ApiOperation({ summary: 'Get book detail by slug' })
    @ApiParam({ name: 'slug', type: String, description: 'The URL-friendly slug of the book' })
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetailBySlug(
        @Param('slug') slug: string,
        @GetLanguageId() langId: number,
    ) {
        return this.catalogService.getBookDetailBySlug(slug, langId);
    }

    @Public()
    @Get('categories')
    @ApiOperation({ summary: 'Get category tree' })
    @ApiOkResponse({ type: [CatalogCategoryTreeDto] })
    getCategories(@GetLanguageId() langId: number) {
        return this.catalogService.getCategories(langId);
    }
}

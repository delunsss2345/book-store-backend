import { GetLanguageCode } from '@/common/decorators/getLanguageCode.decorator';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { SearchBooksQueryDto, SearchFilterQueryDto } from '@/modules/search/dto/request';
import { SearchBookItemDto } from '@/modules/search/dto/response';
import { QuickBookFillResponseDto } from '@/modules/search/dto/response/search-isbn.dto';
import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService } from '../service/search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    // -> nhập query -> chuyển thành vector -> tìm theo vector
    @Public()
    @Get('')
    @ApiOperation({ summary: 'Semantic search for books using vector similarity' })
    @ApiOkResponse({ type: SearchBookItemDto, isArray: true })
    searchSemantic(@Query() query: SearchBooksQueryDto, @GetLanguageId() langId: number) {
        return this.searchService.searchBooks(query, langId);
    }

    @Public()
    @Get('filter')
    @ApiOperation({ summary: 'Filter and sort books by category, price range, and sort order' })
    @ApiOkResponse({ type: SearchBookItemDto, isArray: true })
    async searchFilter(
        @Query() query: SearchFilterQueryDto,
        @GetLanguageId() langId: number,
    ) {
        // const result = await this.searchService.filterBooks(query, langId);
    }

    // admin tạo mới dữ liệu vector của sách
    @Post('reindex')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Reindex all books into the vector store (admin only)' })
    @ApiCreatedResponse({ description: 'Books successfully reindexed' })
    // @RequirePermissions(PermissionCode.SEARCH_REINDEX_BOOKS)
    reindexBooks() {
        return this.searchService.reindexBooks();
    }

    @Public()
    @Get('/isbn')
    @ApiOperation({ summary: 'Look up book details by ISBN' })
    @ApiQuery({ name: 'isbn', type: String, description: 'ISBN-10 or ISBN-13 of the book' })
    @ApiOkResponse({ type: QuickBookFillResponseDto })
    searchByIsbn(
        @GetLanguageId() langId: number,
        @GetLanguageCode() langCode: string,
        @Query('isbn') isbn: string,
    ) {
        return this.searchService.searchISBN(isbn, langId, langCode);
    }
}

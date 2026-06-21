import { GetLanguageCode } from '@/common/decorators/getLanguageCode.decorator';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { SearchBooksQueryDto, SearchFilterQueryDto } from '@/modules/search/dto/request';
import { SearchBookItemDto } from '@/modules/search/dto/response';
import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from '../service/search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    // -> nhập query -> chuyển thành vector -> tìm theo vector
    @Public()
    @Get('')
    @ApiOkResponse({ type: SearchBookItemDto, isArray: true })
    searchSemantic(@Query() query: SearchBooksQueryDto, @GetLanguageId() langId: number) {
        return this.searchService.searchBooks(query, langId);
    }

    @Public()
    @Get('filter')
    searchFilter(
        @Query() query: SearchFilterQueryDto,
        @GetLanguageId() langId: number,
        @GetLanguageCode() langCode: string,
    ) { }

    // admin tạo mới dữ liệu vector của sách 
    @Post('reindex')
    @ApiBearerAuth('access-token')
    // @RequirePermissions(PermissionCode.SEARCH_REINDEX_BOOKS)
    reindexBooks() {
        return this.searchService.reindexBooks();
    }

    @Public()
    @Get('/isbn')
    searchByIsbn(
        @GetLanguageId() langId: number,
        @GetLanguageCode() langCode: string,
        @Query('isbn') isbn: string,
    ) {
        return this.searchService.searchISBN(isbn, langId, langCode);
    }
}

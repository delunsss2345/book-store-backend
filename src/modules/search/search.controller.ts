import { Public } from '@/common/security/decorators/public.decorator';
import { SearchBooksQueryDto } from '@/modules/search/dto/request';
import { SearchBookItemDto } from '@/modules/search/dto/response';
import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    // -> nhập query -> chuyển thành vector -> tìm theo vector
    @Public()
    @Get('')
    @ApiOkResponse({ type: SearchBookItemDto, isArray: true })
    searchSemantic(@Query() query: SearchBooksQueryDto) {
        return this.searchService.searchBooks(query);
    }
    // admin tạo mới dữ liệu vector của sách 
    @Post('reindex')
    @ApiBearerAuth('access-token')
    // @RequirePermissions(PermissionCode.SEARCH_REINDEX_BOOKS)
    reindexBooks() {
        return this.searchService.reindexBooks();
    }
}

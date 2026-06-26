import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthorService } from '../service/author.service';
import { CreateAuthorRequestDto } from '../dto/request/create-author.request.dto';
import { GetAuthorBooksQueryDto } from '../dto/request/get-author-books.query.dto';
import { GetAuthorsQueryDto } from '../dto/request/get-authors.query.dto';
import { AuthorBookListResponseDto } from '../dto/response/author-book-list.response.dto';
import { AuthorItemResponseDto } from '../dto/response/author-item.response.dto';
import { AuthorListResponseDto } from '../dto/response/author-list.response.dto';

@ApiTags('author')
@Controller('authors')
export class AuthorController {
    constructor(private readonly authorService: AuthorService) { }

    @Post()
    @RequirePermissions(PermissionCode.AUTHOR_CREATE)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a new author' })
    @ApiCreatedResponse({ type: AuthorItemResponseDto })
    createAuthor(@Body() body: CreateAuthorRequestDto) {
        return this.authorService.createAuthor(body);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get paginated list of authors' })
    @ApiOkResponse({ type: AuthorListResponseDto })
    getAuthors(@Query() query: GetAuthorsQueryDto, @GetLanguageId() langId: number) {
        return this.authorService.getAuthors(query, langId);
    }

    @Public()
    @Get(':authorId/books')
    @ApiOperation({ summary: 'Get paginated list of books by author' })
    @ApiParam({ name: 'authorId', type: String, description: 'Author ID' })
    @ApiOkResponse({ type: AuthorBookListResponseDto })
    getAuthorBooks(
        @Param('authorId') authorId: string,
        @Query() query: GetAuthorBooksQueryDto,
        @GetLanguageId() langId: number,
    ) {
        return this.authorService.getAuthorBooks(
            Number(authorId),
            query,
            langId,
        );
    }
}

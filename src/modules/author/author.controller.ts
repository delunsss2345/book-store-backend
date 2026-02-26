import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthorService } from './author.service';
import { CreateAuthorRequestDto } from './dto/request/create-author.request.dto';
import { GetAuthorBooksQueryDto } from './dto/request/get-author-books.query.dto';
import { GetAuthorsQueryDto } from './dto/request/get-authors.query.dto';
import { AuthorBookListResponseDto } from './dto/response/author-book-list.response.dto';
import { AuthorItemResponseDto } from './dto/response/author-item.response.dto';
import { AuthorListResponseDto } from './dto/response/author-list.response.dto';

@ApiTags('author')
@Controller('authors')
export class AuthorController {
    constructor(private readonly authorService: AuthorService) { }

    @Post()
    @RequirePermissions(PermissionCode.AUTHOR_CREATE)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: AuthorItemResponseDto })
    createAuthor(@Body() body: CreateAuthorRequestDto) {
        return this.authorService.createAuthor(body);
    }

    @Public()
    @Get()
    @ApiOkResponse({ type: AuthorListResponseDto })
    getAuthors(@Query() query: GetAuthorsQueryDto, @GetLanguage() lang: string) {
        const effectiveLang = query.lang ?? lang;
        return this.authorService.getAuthors({ ...query, lang: effectiveLang });
    }

    @Public()
    @Get(':authorId/books')
    @ApiOkResponse({ type: AuthorBookListResponseDto })
    getAuthorBooks(
        @Param('authorId') authorId: string,
        @Query() query: GetAuthorBooksQueryDto,
        @GetLanguage() lang: string,
    ) {
        const effectiveLang = query.lang ?? lang;
        return this.authorService.getAuthorBooks(
            parseBigIntRequired(authorId, 'authorId'),
            { ...query, lang: effectiveLang },
        );
    }
}

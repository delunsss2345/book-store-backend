import { Public } from '@/common/security/decorators/public.decorator';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetAuthorBooksQueryDto } from './dto/request/get-author-books.query.dto';
import { GetAuthorsQueryDto } from './dto/request/get-authors.query.dto';
import { AuthorBookListResponseDto } from './dto/response/author-book-list.response.dto';
import { AuthorListResponseDto } from './dto/response/author-list.response.dto';
import { AuthorService } from './author.service';

@ApiTags('author')
@Controller('authors')
export class AuthorController {
    constructor(private readonly authorService: AuthorService) { }

    @Public()
    @Get()
    @ApiOkResponse({ type: AuthorListResponseDto })
    getAuthors(@Query() query: GetAuthorsQueryDto) {
        return this.authorService.getAuthors(query);
    }

    @Public()
    @Get(':authorId/books')
    @ApiOkResponse({ type: AuthorBookListResponseDto })
    getAuthorBooks(
        @Param('authorId') authorId: string,
        @Query() query: GetAuthorBooksQueryDto,
    ) {
        return this.authorService.getAuthorBooks(this.parseBigInt(authorId, 'authorId'), query);
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

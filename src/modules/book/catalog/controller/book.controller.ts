import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CatalogBookDetailDto } from '../dto/response';
import { CatalogService } from '../service/catalog.service';

@ApiTags('books')
@Controller('books')
export class BookController {
    constructor(private readonly catalogService: CatalogService) { }

    @Public()
    @Get(':bookId')
    @ApiOperation({ summary: 'Get book detail by book ID' })
    @ApiParam({ name: 'bookId', type: Number, description: 'The ID of the book' })
    @ApiOkResponse({ type: CatalogBookDetailDto })
    getBookDetail(
        @Param('bookId') bookId: string,
        @GetLanguageId() langId: number,
    ) {
        return this.catalogService.getBookDetail(Number(bookId), langId);
    }
}

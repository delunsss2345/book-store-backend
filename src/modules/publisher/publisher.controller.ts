import { Public } from '@/common/security/decorators/public.decorator';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetPublisherBooksQueryDto } from './dto/request/get-publisher-books.query.dto';
import { GetPublishersQueryDto } from './dto/request/get-publishers.query.dto';
import { PublisherBookListResponseDto } from './dto/response/publisher-book-list.response.dto';
import { PublisherListResponseDto } from './dto/response/publisher-list.response.dto';
import { PublisherService } from './publisher.service';

@ApiTags('publisher')
@Controller('publishers')
export class PublisherController {
    constructor(private readonly publisherService: PublisherService) { }

    @Public()
    @Get()
    @ApiOkResponse({ type: PublisherListResponseDto })
    getPublishers(@Query() query: GetPublishersQueryDto) {
        return this.publisherService.getPublishers(query);
    }

    @Public()
    @Get(':publisherId/books')
    @ApiOkResponse({ type: PublisherBookListResponseDto })
    getPublisherBooks(
        @Param('publisherId') publisherId: string,
        @Query() query: GetPublisherBooksQueryDto,
    ) {
        return this.publisherService.getPublisherBooks(
            this.parseBigInt(publisherId, 'publisherId'),
            query,
        );
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

import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreatePublisherRequestDto } from '../dto/request/create-publisher.request.dto';
import { GetPublisherBooksQueryDto } from '../dto/request/get-publisher-books.query.dto';
import { GetPublishersQueryDto } from '../dto/request/get-publishers.query.dto';
import { PublisherBookListResponseDto } from '../dto/response/publisher-book-list.response.dto';
import { PublisherItemResponseDto } from '../dto/response/publisher-item.response.dto';
import { PublisherListResponseDto } from '../dto/response/publisher-list.response.dto';
import { PublisherService } from '../service/publisher.service';

@ApiTags('publisher')
@Controller('publishers')
export class PublisherController {
    constructor(private readonly publisherService: PublisherService) { }

    @Post()
    @RequirePermissions(PermissionCode.PUBLISHER_CREATE)
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Create a new publisher' })
    @ApiCreatedResponse({ type: PublisherItemResponseDto })
    createPublisher(@Body() body: CreatePublisherRequestDto) {
        return this.publisherService.createPublisher(body);
    }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get a paginated list of publishers' })
    @ApiOkResponse({ type: PublisherListResponseDto })
    getPublishers(@Query() query: GetPublishersQueryDto) {
        return this.publisherService.getPublishers(query);
    }

    @Public()
    @Get(':publisherId/books')
    @ApiOperation({ summary: 'Get a paginated list of books for a publisher' })
    @ApiParam({ name: 'publisherId', type: Number, description: 'Publisher ID' })
    @ApiOkResponse({ type: PublisherBookListResponseDto })
    getPublisherBooks(
        @Param('publisherId') publisherId: string,
        @Query() query: GetPublisherBooksQueryDto,
        @GetLanguageId() langId: number,
    ) {
        return this.publisherService.getPublisherBooks(
            Number(publisherId),
            query,
            langId,
        );
    }

}

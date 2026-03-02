import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreatePublisherRequestDto } from './dto/request/create-publisher.request.dto';
import { GetPublisherBooksQueryDto } from './dto/request/get-publisher-books.query.dto';
import { GetPublishersQueryDto } from './dto/request/get-publishers.query.dto';
import { PublisherBookListResponseDto } from './dto/response/publisher-book-list.response.dto';
import { PublisherItemResponseDto } from './dto/response/publisher-item.response.dto';
import { PublisherListResponseDto } from './dto/response/publisher-list.response.dto';
import { PublisherService } from './publisher.service';

@ApiTags('publisher')
@Controller('publishers')
export class PublisherController {
    constructor(private readonly publisherService: PublisherService) { }

    @Post()
    @RequirePermissions(PermissionCode.PUBLISHER_CREATE)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: PublisherItemResponseDto })
    createPublisher(@Body() body: CreatePublisherRequestDto) {
        return this.publisherService.createPublisher(body);
    }

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
        @GetLanguage() lang: string,
    ) {
        return this.publisherService.getPublisherBooks(
            parseBigIntRequired(publisherId, 'publisherId'),
            query,
            lang,
        );
    }

}

import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { Public } from '@/common/security/decorators/public.decorator';
import { ReviewAIService } from '@/modules/review-ai/review-ai.service';
import { ReviewDraftResponseDto } from '@/modules/review/dto/response/review-daft.response.dto';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateReviewDraftRequestDto } from './dto/request/create-review-daft.request.dto';
import { CreateReviewRequestDto } from './dto/request/create-review.request.dto';
import { GetBookReviewsQueryDto } from './dto/request/get-book-reviews.query.dto';
import { ReviewItemResponseDto } from './dto/response/review-item.response.dto';
import { ReviewListResponseDto } from './dto/response/review-list.response.dto';
import { ReviewService } from './review.service';

@ApiTags('review')
@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService,
        private readonly reviewAIService: ReviewAIService
    ) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: ReviewItemResponseDto })
    createReview(@GetUser() user: JwtPayload, @Body() body: CreateReviewRequestDto) {
        const userId = parseBigIntRequired(user?.sub, 'user.sub');
        return this.reviewService.createReview(userId, body);
    }

    @Post('review/draft')
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: ReviewDraftResponseDto })
    createReviewDaft(@GetUser() user: JwtPayload, @Body() body: CreateReviewDraftRequestDto) {
        const userId = parseBigIntRequired(user?.sub, 'user.sub');
        return this.reviewAIService.createReviewDraft(userId, body);
    }

    @Public()
    @Get('books/:slug')
    @ApiOkResponse({ type: ReviewListResponseDto })
    getBookReviews(
        @Param('slug') slug: string,
        @Query() query: GetBookReviewsQueryDto,
        @GetLanguageId() langId: number,
    ) {
        return this.reviewService.getBookReviews(slug, query, langId);
    }
}

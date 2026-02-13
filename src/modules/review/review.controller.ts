import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetBookReviewsQueryDto } from './dto/request/get-book-reviews.query.dto';
import { ReviewListResponseDto } from './dto/response/review-list.response.dto';
import { ReviewService } from './review.service';

@ApiTags('review')
@Controller('reviews')
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

    @Public()
    @Get('books/:slug')
    @ApiOkResponse({ type: ReviewListResponseDto })
    getBookReviews(
        @Param('slug') slug: string,
        @Query() query: GetBookReviewsQueryDto,
    ) {
        return this.reviewService.getBookReviews(slug, query);
    }
}

import { ReviewMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewRequestDto } from './dto/request/create-review.request.dto';
import { GetBookReviewsQueryDto } from './dto/request/get-book-reviews.query.dto';
import {
  ReviewItemResponseDto,
  ReviewVariantResponseDto,
} from './dto/response/review-item.response.dto';
import { ReviewListResponseDto } from './dto/response/review-list.response.dto';
import { ReviewRepository } from './review.repository';

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async createReview(
    userId: bigint,
    body: CreateReviewRequestDto,
  ): Promise<ReviewItemResponseDto> {
    const bookId = BigInt(body.bookId);
    const bookVariantId = BigInt(body.bookVariantId);

    const purchased = await this.reviewRepository.hasPurchasedBookVariant(
      userId,
      bookVariantId,
    );
    if (!purchased) {
      throw new BadRequestException(
        ReviewMessage.YOU_CAN_ONLY_REVIEW_VARIANTS_THAT_YOU_HAVE_PURCHASED,
      );
    }

    const existing =
      await this.reviewRepository.findReviewByUserAndBookAndVariant(
        userId,
        bookId,
        bookVariantId,
      );
    if (existing) {
      throw new ConflictException(
        ReviewMessage.YOU_HAVE_ALREADY_REVIEWED_THIS_BOOK_VARIANT,
      );
    }

    const normalizedContent = body.content?.trim() ? body.content.trim() : null;
    const created = await this.reviewRepository.createReview(
      userId,
      bookId,
      bookVariantId,
      body.rating,
      normalizedContent,
    );

    return {
      reviewId: created.id.toString(),
      userId: created.userId.toString(),
      rating: created.rating,
      content: created.content ?? null,
      createdAt: created.createdAt,
      variant: {
        id: created.bookVariant.id.toString(),
        format: created.bookVariant.format,
      },
    };
  }

  async getBookReviews(
    slug: string,
    query: GetBookReviewsQueryDto,
    langId: number,
  ): Promise<ReviewListResponseDto> {
    const normalizedSlug = slug?.trim();
    if (!normalizedSlug) {
      throw new BadRequestException(ReviewMessage.SLUG_REQUIRED);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const book = await this.reviewRepository.findBookBySlug(
      normalizedSlug,
      langId,
    );
    if (!book) {
      throw new NotFoundException(ReviewMessage.BOOK_NOT_FOUND);
    }

    const [total, rows] = await Promise.all([
      this.reviewRepository.countReviewsByBookId(book.id),
      this.reviewRepository.findReviewsByBookId(book.id, page, limit),
    ]);

    const items: ReviewItemResponseDto[] = rows.map((row) => {
      const variant: ReviewVariantResponseDto = {
        id: row.bookVariant.id.toString(),
        format: row.bookVariant.format,
      };

      return {
        reviewId: row.id.toString(),
        userId: row.userId.toString(),
        rating: row.rating,
        content: row.content ?? null,
        createdAt: row.createdAt,
        variant,
      };
    });

    return buildPaginatedResult(items, total, page, limit);
  }
}

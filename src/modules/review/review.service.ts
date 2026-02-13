import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GetBookReviewsQueryDto } from './dto/request/get-book-reviews.query.dto';
import {
    ReviewItemResponseDto,
    ReviewVariantResponseDto,
} from './dto/response/review-item.response.dto';
import { ReviewListResponseDto } from './dto/response/review-list.response.dto';
import { ReviewRepository } from './review.repository';

@Injectable()
export class ReviewService {
    constructor(private readonly reviewRepository: ReviewRepository) { }

    async getBookReviews(
        slug: string,
        query: GetBookReviewsQueryDto,
    ): Promise<ReviewListResponseDto> {
        const normalizedSlug = slug?.trim();
        if (!normalizedSlug) {
            throw new BadRequestException('slug is required');
        }

        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const language = await this.resolveLanguage(query.lang);

        const book = await this.reviewRepository.findBookBySlug(normalizedSlug, language.id);
        if (!book) {
            throw new NotFoundException('Book not found');
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

        return {
            page,
            limit,
            total,
            totalPages: total ? Math.ceil(total / limit) : 0,
            items,
        };
    }

    private async resolveLanguage(lang?: string): Promise<{ id: number; code: string }> {
        const normalized = (lang ?? 'en').trim().toLowerCase();
        const found = await this.reviewRepository.findLanguageByCode(normalized);
        if (!found) {
            throw new NotFoundException(`Language "${normalized}" is not active`);
        }

        return found;
    }
}

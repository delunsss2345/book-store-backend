import { CatalogService } from '@/modules/catalog/catalog.service';
import { CreateReviewDraftRequestDto } from '@/modules/review/dto/request/create-review-daft.request.dto';
import { ReviewRepository } from '@/modules/review/review.repository';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { ReviewDraftResponseDto } from '../review/dto/response/review-daft.response.dto';

@Injectable()
export class ReviewAIService {
    constructor(private readonly reviewRepository: ReviewRepository,
        private readonly catalogService: CatalogService,
        private readonly geminiService: GeminiService) { }

    async createReviewDraft(
        userId: bigint,
        body: CreateReviewDraftRequestDto,
    ): Promise<ReviewDraftResponseDto> {
        const bookId = BigInt(body.bookId);
        const bookVariantId = BigInt(body.bookVariantId);

        const purchased = await this.reviewRepository.hasPurchasedBookVariant(userId, bookVariantId);
        if (!purchased) {
            throw new BadRequestException('You can only review variants that you have purchased');
        }

        const existing = await this.reviewRepository.findReviewByUserAndBookAndVariant(
            userId,
            bookId,
            bookVariantId,
        );
        if (existing) {
            throw new ConflictException('You have already reviewed this book variant');
        }

        const normalizedHint = body.userHint?.trim();
        if (!normalizedHint) {
            throw new BadRequestException('userHint is required');
        }

        const book = await this.catalogService.getBookDetail(
            bookId,
            body.language ?? 'vi',
        );

        const bookVariant = book.variants.find(
            (it) => it.id.toString() === bookVariantId.toString(),
        );
        if (!bookVariant) {
            throw new NotFoundException('Book variant not found in this book');
        }

        // Gọi Gemini với context đã nạp từ DB
        const draft = await this.geminiService.generateReviewDraft({
            title: book.title,
            format: bookVariant.format,
            userHint: normalizedHint,
            targetWords: body.targetWords ?? 100,

        });


        return {
            bookId: bookId.toString(),
            bookVariantId: bookVariantId.toString(),
            draftText: draft.draftText,
            wordCount: draft.wordCount
        };
    }

}

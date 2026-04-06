import { LanguageMessage, ReviewAIMessage } from '@/common';
import { CatalogService } from '@/modules/catalog/catalog.service';
import { LanguageRepository } from '@/modules/language/language.repository';
import { CreateReviewDraftRequestDto } from '@/modules/review/dto/request/create-review-daft.request.dto';
import { ReviewRepository } from '@/modules/review/review.repository';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { ReviewDraftResponseDto } from '../review/dto/response/review-daft.response.dto';

@Injectable()
export class ReviewAIService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly catalogService: CatalogService,
    private readonly languageRepository: LanguageRepository,
    private readonly geminiService: GeminiService,
  ) {}

  async createReviewDraft(
    userId: bigint,
    body: CreateReviewDraftRequestDto,
  ): Promise<ReviewDraftResponseDto> {
    const bookId = BigInt(body.bookId);
    const bookVariantId = BigInt(body.bookVariantId);

    const purchased = await this.reviewRepository.hasPurchasedBookVariant(
      userId,
      bookVariantId,
    );
    if (!purchased) {
      throw new BadRequestException(
        ReviewAIMessage.YOU_CAN_ONLY_REVIEW_VARIANTS_THAT_YOU_HAVE_PURCHASED,
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
        ReviewAIMessage.YOU_HAVE_ALREADY_REVIEWED_THIS_BOOK_VARIANT,
      );
    }

    const normalizedHint = body.userHint?.trim();
    if (!normalizedHint) {
      throw new BadRequestException(ReviewAIMessage.USER_HINT_REQUIRED);
    }

    const language = await this.loadLanguageByCode(body.language ?? 'vi');

    const book = await this.catalogService.getBookDetail(bookId, language.id);

    const bookVariant = book.variants.find(
      (it) => it.id.toString() === bookVariantId.toString(),
    );
    if (!bookVariant) {
      throw new NotFoundException(
        ReviewAIMessage.BOOK_VARIANT_NOT_FOUND_IN_THIS_BOOK,
      );
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
      wordCount: draft.wordCount,
    };
  }

  private async loadLanguageByCode(langCode: string) {
    const normalized = langCode.trim().toLowerCase();
    const found = await this.languageRepository.findLanguageByCode(normalized);
    if (found) {
      return found;
    }

    const fallback = await this.languageRepository.findDefaultLanguage();
    if (!fallback) {
      throw new NotFoundException(LanguageMessage.NO_ACTIVE_LANGUAGE_FOUND);
    }

    return fallback;
  }
}

import { CatalogModule } from '@/modules/catalog';
import { GeminiModule } from '@/modules/gemini/gemini.module';
import { LanguageRepository } from '@/modules/language/language.repository';
import { ReviewAIService } from '@/modules/review-ai/review-ai.service';
import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

@Module({
    imports: [CatalogModule, GeminiModule],
    controllers: [ReviewController],
    providers: [ReviewService, ReviewRepository, ReviewAIService, LanguageRepository],
    exports: [ReviewService, ReviewRepository],
})
export class ReviewModule { }

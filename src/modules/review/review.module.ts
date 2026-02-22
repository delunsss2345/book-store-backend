import { CatalogModule } from '@/modules/catalog';
import { GeminiModule } from '@/modules/gemini/gemini.module';
import { LanguageModule } from '@/modules/language/language.module';
import { ReviewAIService } from '@/modules/review-ai/review-ai.service';
import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './review.repository';
import { ReviewService } from './review.service';

@Module({
    imports: [CatalogModule, GeminiModule, LanguageModule],
    controllers: [ReviewController],
    providers: [ReviewService, ReviewRepository, ReviewAIService],
    exports: [ReviewService, ReviewRepository],
})
export class ReviewModule { }

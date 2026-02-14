import { CatalogModule } from '@/modules/catalog';
import { GeminiModule } from '@/modules/gemini/gemini.module';
import { ReviewAIService } from '@/modules/review-ai/review-ai.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [CatalogModule, GeminiModule],
    providers: [ReviewAIService],
    exports: [ReviewAIService]
})
export class ReviewAIModule { };
import { GeminiService } from '@/modules/gemini/gemini.service';
import { Module } from '@nestjs/common';

@Module({
    providers: [GeminiService],
    exports: [GeminiService],
})
export class GeminiModule { };

import { CacheProvider } from '@/config/redis.config';
import { CatalogModule } from '@/modules/catalog';
import { GeminiModule } from '@/modules/gemini/gemini.module';
import { LanguageModule } from '@/modules/language/language.module';
import { PineconeModule } from '@/modules/pinecone/pinecone.module';
import { SearchController } from '@/modules/search/search.controller';
import { SearchService } from '@/modules/search/search.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [CatalogModule, PineconeModule, CacheProvider, LanguageModule, GeminiModule],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService]
})
export class SearchModule { };

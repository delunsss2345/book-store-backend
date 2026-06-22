import { CacheProvider } from '@/config/redis.config';
import { CatalogModule } from '@/modules/book/catalog/catalog.module';
import { GroqModule } from '@/modules/groq/groq.module';
import { PineconeModule } from '@/modules/pinecone/pinecone.module';
import { SearchController } from '@/modules/search/controller/search.controller';
import { SearchService } from '@/modules/search/service/search.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [CatalogModule, PineconeModule, CacheProvider, GroqModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

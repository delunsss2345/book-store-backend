import { CatalogModule } from '@/modules/book/catalog/catalog.module';
import { GroqModule } from '@/modules/groq/groq.module';
import { PineconeService } from '@/modules/pinecone/service/pinecone.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [GroqModule, CatalogModule],
  providers: [PineconeService],
  exports: [PineconeService],
})
export class PineconeModule {}

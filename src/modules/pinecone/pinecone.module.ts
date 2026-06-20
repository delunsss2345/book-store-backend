import { CatalogModule } from '@/modules/catalog/catalog.module';
import { GeminiModule } from '@/modules/gemini/gemini.module';
import { PineconeService } from '@/modules/pinecone/service/pinecone.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [GeminiModule, CatalogModule],
    providers: [PineconeService],
    exports: [PineconeService]
})
export class PineconeModule { };

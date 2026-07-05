import { CacheVersionModule } from '@/modules/cache-version/cache-version.module';
import { Module } from '@nestjs/common';
import { BookController } from './controller/book.controller';
import { CatalogController } from './controller/catalog.controller';
import { CatalogRepository } from './repository/catalog.repository';
import { CatalogService } from './service/catalog.service';

@Module({
    imports: [CacheVersionModule],
    controllers: [CatalogController, BookController],
    providers: [CatalogService, CatalogRepository],
    exports: [CatalogService, CatalogRepository],
})
export class CatalogModule { }

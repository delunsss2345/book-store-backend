import { CacheProvider } from '@/config/redis.config';
import { LanguageModule } from '@/modules/language/language.module';
import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';

@Module({
    imports: [CacheProvider, LanguageModule],
    controllers: [CatalogController],
    providers: [CatalogService, CatalogRepository],
    exports: [CatalogService, CatalogRepository],
})
export class CatalogModule { }

import { CacheProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';

@Module({
    imports: [CacheProvider],
    controllers: [CatalogController],
    providers: [CatalogService, CatalogRepository],
    exports: [CatalogService],
})
export class CatalogModule { }

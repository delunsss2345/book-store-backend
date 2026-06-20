import { CacheProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { CatalogController } from './controller/catalog.controller';
import { CatalogRepository } from './repository/catalog.repository';
import { CatalogService } from './service/catalog.service';

@Module({
    imports: [CacheProvider],
    controllers: [CatalogController],
    providers: [CatalogService, CatalogRepository],
    exports: [CatalogService, CatalogRepository],
})
export class CatalogModule { }

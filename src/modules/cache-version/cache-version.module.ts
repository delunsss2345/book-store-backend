import { CacheVersionService } from '@/modules/cache-version/service/cache-version.service';
import { Module } from '@nestjs/common';

@Module({
    exports: [CacheVersionService],
    providers: [CacheVersionService],
})
export class CacheVersionModule { };
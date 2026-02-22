import { CacheProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { LanguageRepository } from './language.repository';
import { LanguageService } from './language.service';

@Module({
    imports: [CacheProvider],
    providers: [LanguageService, LanguageRepository],
    exports: [LanguageService],
})
export class LanguageModule { }

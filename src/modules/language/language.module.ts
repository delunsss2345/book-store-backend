import { CacheProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { LanguageController } from './language.controller';
import { LanguageRepository } from './language.repository';
import { LanguageService } from './language.service';

@Module({
  imports: [CacheProvider],
  controllers: [LanguageController],
  providers: [LanguageService, LanguageRepository],
  exports: [LanguageService],
})
export class LanguageModule {}

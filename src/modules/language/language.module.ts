import { CacheProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { LanguageController } from './controller/language.controller';
import { LanguageRepository } from './repository/language.repository';
import { LanguageService } from './service/language.service';

@Module({
  imports: [CacheProvider],
  controllers: [LanguageController],
  providers: [LanguageService, LanguageRepository],
  exports: [LanguageService],
})
export class LanguageModule {}

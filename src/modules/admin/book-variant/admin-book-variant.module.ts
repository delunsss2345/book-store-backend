import { CacheProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { AdminBookVariantController } from './controller/admin-book-variants.controller';
import { AdminBookVariantsRepository } from './repository/admin-book-variant.repository';
import { AdminBookVariantsService } from './service/admin-book-variant.service';

@Module({
  imports: [CacheProvider],
  controllers: [AdminBookVariantController],
  providers: [AdminBookVariantsService, AdminBookVariantsRepository],
  exports: [AdminBookVariantsService, AdminBookVariantsRepository],
})
export class AdminBookVariantModule { }

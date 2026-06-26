import { CacheProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { AdminCategoryController } from './controller/admin-category.controller';
import { AdminCategoryRepository } from './repository/admin-category.repository';
import { AdminCategoryService } from './service/admin-category.service';

@Module({
  imports: [CacheProvider],
  controllers: [AdminCategoryController],
  providers: [AdminCategoryService, AdminCategoryRepository],
  exports: [AdminCategoryService, AdminCategoryRepository],
})
export class AdminCategoryModule { }

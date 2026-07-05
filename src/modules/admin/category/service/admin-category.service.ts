import { cacheKey } from '@/common/constants/cache-key.constant';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AdminCategoryStatsResponseDto } from '../dto/response/admin-category-stats.response.dto';
import { AdminCategoryRepository } from '../repository/admin-category.repository';

const ADMIN_CATEGORY_STATS_CACHE_TTL = 86_400_000;

@Injectable()
export class AdminCategoryService {
  constructor(
    private readonly adminCategoryRepository: AdminCategoryRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getStats(): Promise<AdminCategoryStatsResponseDto> {
    const cached = await this.cacheManager.get<AdminCategoryStatsResponseDto>(
      cacheKey.admin.categoryStats(),
    );
    if (cached) {
      return cached;
    }

    const [totalCategories, activeCategories] = await Promise.all([
      this.adminCategoryRepository.countCategories(),
      this.adminCategoryRepository.countActiveCategories(),
    ]);

    const response: AdminCategoryStatsResponseDto = {
      totalCategories,
      activeCategories,
    };

    await this.cacheManager.set(
      cacheKey.admin.categoryStats(),
      response,
      ADMIN_CATEGORY_STATS_CACHE_TTL,
    );

    return response;
  }
}

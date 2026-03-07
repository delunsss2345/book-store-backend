import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AdminCategoryStatsResponseDto } from '../dto/response';
import { AdminCategoryRepository } from './admin-category.repository';

const ADMIN_CATEGORY_STATS_CACHE_KEY = 'admin:categories:stats';
const ADMIN_CATEGORY_STATS_CACHE_TTL = 86_400_000;

@Injectable()
export class AdminCategoryService {
  constructor(
    private readonly adminCategoryRepository: AdminCategoryRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getStats(): Promise<AdminCategoryStatsResponseDto> {
    const cached = await this.cacheManager.get<AdminCategoryStatsResponseDto>(
      ADMIN_CATEGORY_STATS_CACHE_KEY,
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
      ADMIN_CATEGORY_STATS_CACHE_KEY,
      response,
      ADMIN_CATEGORY_STATS_CACHE_TTL,
    );

    return response;
  }
}

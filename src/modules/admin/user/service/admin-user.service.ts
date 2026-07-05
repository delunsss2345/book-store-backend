import { cacheKey } from '@/common/constants/cache-key.constant';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AdminUserListQueryDto } from '../dto/request';
import {
  AdminUserListResponseDto,
  AdminUserStatsResponseDto,
} from '../dto/response';
import { toUserItem } from '../mapper';
import { AdminUserRepository } from '../repository/admin-user.repository';

const ADMIN_USER_STATS_CACHE_TTL = 86_400_000;

@Injectable()
export class AdminUserService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getUsers(
    query: AdminUserListQueryDto,
  ): Promise<AdminUserListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminUserRepository.countUsers(),
      this.adminUserRepository.findUsers(page, limit),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toUserItem(row)),
      total,
      page,
      limit,
    );
  }

  async getNonCustomerUsers(
    query: AdminUserListQueryDto,
  ): Promise<AdminUserListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminUserRepository.countNonCustomerUsers(),
      this.adminUserRepository.findNonCustomerUsers(page, limit),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toUserItem(row)),
      total,
      page,
      limit,
    );
  }

  async getStats(): Promise<AdminUserStatsResponseDto> {
    const cached = await this.cacheManager.get<AdminUserStatsResponseDto>(
      cacheKey.admin.userStats(),
    );
    if (cached) {
      return cached;
    }

    const since = new Date(Date.now() - ADMIN_USER_STATS_CACHE_TTL);
    const [totalUsers, customersLoggedInLast24Hours] = await Promise.all([
      this.adminUserRepository.countUsers(),
      this.adminUserRepository.countCustomersLoggedInSince(since),
    ]);

    const response: AdminUserStatsResponseDto = {
      totalUsers,
      customersLoggedInLast24Hours,
    };

    await this.cacheManager.set(
      cacheKey.admin.userStats(),
      response,
      ADMIN_USER_STATS_CACHE_TTL,
    );

    return response;
  }
}

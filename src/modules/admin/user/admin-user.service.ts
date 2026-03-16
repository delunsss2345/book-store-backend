import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { AdminUserListQueryDto } from '../dto/request';
import {
  AdminUserItemResponseDto,
  AdminUserListResponseDto,
  AdminUserRoleItemResponseDto,
  AdminUserStatsResponseDto,
} from '../dto/response';
import { AdminUserRepository } from './admin-user.repository';

type UserRow = Awaited<ReturnType<AdminUserRepository['findUsers']>>[number];
type NonCustomerUserRow = Awaited<
  ReturnType<AdminUserRepository['findNonCustomerUsers']>
>[number];

const ADMIN_USER_STATS_CACHE_KEY = 'admin:users:stats';
const ADMIN_USER_STATS_CACHE_TTL = 86_400_000;

@Injectable()
export class AdminUserService {
  constructor(
    private readonly adminUserRepository: AdminUserRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

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
      rows.map((row) => this.toUserItem(row)),
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
      rows.map((row) => this.toUserItem(row)),
      total,
      page,
      limit,
    );
  }

  async getStats(): Promise<AdminUserStatsResponseDto> {
    const cached = await this.cacheManager.get<AdminUserStatsResponseDto>(
      ADMIN_USER_STATS_CACHE_KEY,
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
      ADMIN_USER_STATS_CACHE_KEY,
      response,
      ADMIN_USER_STATS_CACHE_TTL,
    );

    return response;
  }

  private toUserItem(
    row: UserRow | NonCustomerUserRow,
  ): AdminUserItemResponseDto {
    const roles: AdminUserRoleItemResponseDto[] = row.userRoles.map((item) => ({
      id: item.role.id.toString(),
      code: String(item.role.code),
      name: item.role.name,
    }));

    return {
      id: row.id.toString(),
      email: row.email,
      firstName: row.firstName ?? null,
      lastName: row.lastName ?? null,
      status: String(row.status),
      isEmailVerified: row.isEmailVerified,
      lastLoginAt: row.lastLoginAt ?? null,
      createdAt: row.createdAt,
      roles,
    };
  }
}

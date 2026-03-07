import { Injectable } from '@nestjs/common';
import { AdminUserRepository } from './admin-user.repository';
import { AdminUserListQueryDto } from '../dto/request';
import {
  AdminUserItemResponseDto,
  AdminUserListResponseDto,
  AdminUserRoleItemResponseDto,
} from '../dto/response';

type UserRow = Awaited<ReturnType<AdminUserRepository['findUsers']>>[number];
type NonCustomerUserRow = Awaited<
  ReturnType<AdminUserRepository['findNonCustomerUsers']>
>[number];

@Injectable()
export class AdminUserService {
  constructor(private readonly adminUserRepository: AdminUserRepository) {}

  async getUsers(
    query: AdminUserListQueryDto,
  ): Promise<AdminUserListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminUserRepository.countUsers(),
      this.adminUserRepository.findUsers(page, limit),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
      items: rows.map((row) => this.toUserItem(row)),
    };
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

    return {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
      items: rows.map((row) => this.toUserItem(row)),
    };
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

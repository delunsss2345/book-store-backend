import {
  AdminUserItemResponseDto,
  AdminUserRoleItemResponseDto,
} from '@/modules/admin/dto/response';
import { AdminUserRepository } from '../admin-user.repository';

type UserRow = Awaited<ReturnType<AdminUserRepository['findUsers']>>[number];
type NonCustomerUserRow = Awaited<
  ReturnType<AdminUserRepository['findNonCustomerUsers']>
>[number];

export function toUserItem(
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

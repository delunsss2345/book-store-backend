import { RolePermission } from '@prisma/client';
import { RolePermissionResponseDto } from '../dto/response/role-permission.response.dto';

export function toRolePermissionResponse(
  row: RolePermission,
): RolePermissionResponseDto {
  return {
    roleId: row.roleId.toString(),
    permissionId: row.permissionId.toString(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

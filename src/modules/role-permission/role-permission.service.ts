import { RolePermissionMessage } from '@/common';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RolePermission } from '@prisma/client';
import { RolePermissionResponseDto } from './dto/response';
import { RolePermissionRepository } from './role-permission.repository';

export type CreateRolePermissionParams = {
  roleId: bigint;
  permissionId: bigint;
};

@Injectable()
export class RolePermissionService {
  constructor(
    private readonly rolePermissionRepository: RolePermissionRepository,
  ) {}

  async createRolePermission(
    params: CreateRolePermissionParams,
  ): Promise<RolePermissionResponseDto> {
    const [role, permission] = await Promise.all([
      this.rolePermissionRepository.findRoleById(params.roleId),
      this.rolePermissionRepository.findPermissionById(params.permissionId),
    ]);

    if (!role) {
      throw new NotFoundException(RolePermissionMessage.ROLE_NOT_FOUND);
    }

    if (!permission) {
      throw new NotFoundException(RolePermissionMessage.PERMISSION_NOT_FOUND);
    }

    const existed = await this.rolePermissionRepository.findByComposite(
      params.roleId,
      params.permissionId,
    );

    if (existed) {
      throw new ConflictException(
        RolePermissionMessage.ROLE_PERMISSION_ALREADY_EXISTS,
      );
    }

    const created = await this.rolePermissionRepository.createRolePermission(
      params.roleId,
      params.permissionId,
    );

    return this.toResponse(created);
  }

  async getByRoleId(roleId: bigint) {
    const rows = await this.rolePermissionRepository.findByRoleId(roleId);
    console.log(rows);
    return rows.map((row) => row.permission.code);
  }

  async getByPermissionId(
    permissionId: bigint,
  ): Promise<RolePermissionResponseDto[]> {
    const rows =
      await this.rolePermissionRepository.findByPermissionId(permissionId);
    return rows.map((row) => this.toResponse(row));
  }

  private toResponse(row: RolePermission): RolePermissionResponseDto {
    return {
      roleId: row.roleId.toString(),
      permissionId: row.permissionId.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

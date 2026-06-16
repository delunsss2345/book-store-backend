import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RolePermissionRepository {
    constructor(private readonly prisma: PrismaService) { }

    findRoleById(roleId: bigint) {
        return this.prisma.role.findUnique({
            where: { id: roleId },
            select: { id: true },
        });
    }

    findPermissionById(permissionId: bigint) {
        return this.prisma.permission.findUnique({
            where: { id: permissionId },
            select: { id: true },
        });
    }

    findByComposite(roleId: bigint, permissionId: bigint) {
        return this.prisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {
                    roleId,
                    permissionId,
                },
            },
        });
    }

    createRolePermission(roleId: bigint, permissionId: bigint) {
        return this.prisma.rolePermission.create({
            data: {
                roleId,
                permissionId,
            },
        });
    }

    findByRoleId(roleId: bigint) {
        return this.prisma.rolePermission.findMany({
            where: { roleId },
            orderBy: { createdAt: 'desc' },
            select: {
                permission: {
                    select: { code: true }
                }
            }
        });
    }

    findByPermissionId(permissionId: bigint) {
        return this.prisma.rolePermission.findMany({
            where: { permissionId },
            orderBy: { createdAt: 'desc' },
        });
    }
}

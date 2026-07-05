import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RolePermissionRepository {
    constructor(private readonly prisma: PrismaService) { }

    findRoleById(roleId: number) {
        return this.prisma.role.findUnique({
            where: { id: roleId },
            select: { id: true },
        });
    }

    findPermissionById(permissionId: number) {
        return this.prisma.permission.findUnique({
            where: { id: permissionId },
            select: { id: true },
        });
    }

    findByComposite(roleId: number, permissionId: number) {
        return this.prisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {
                    roleId,
                    permissionId,
                },
            },
        });
    }

    createRolePermission(roleId: number, permissionId: number) {
        return this.prisma.rolePermission.create({
            data: {
                roleId,
                permissionId,
            },
        });
    }

    findByRoleId(roleId: number) {
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

    findByPermissionId(permissionId: number) {
        return this.prisma.rolePermission.findMany({
            where: { permissionId },
            orderBy: { createdAt: 'desc' },
        });
    }
}

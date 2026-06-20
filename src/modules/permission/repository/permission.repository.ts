import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { HTTPMethod, Prisma } from '@prisma/client';

export type CreatePermissionParams = {
    code: string;
    description?: string;
    method: HTTPMethod;
    pathPattern: string;
    isActive?: boolean;
};

export type UpdatePermissionParams = {
    code?: string;
    description?: string;
    method?: HTTPMethod;
    pathPattern?: string;
    isActive?: boolean;
};

@Injectable()
export class PermissionRepository {
    constructor(private readonly prisma: PrismaService) { }

    findAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: {
                id: 'desc',
            },
        });
    }

    findPermissionByName(name: string) {
        return this.prisma.permission.findMany({
            where: {
                code: {
                    startsWith: name,
                }
            }
        })
    }

    createPermission(params: CreatePermissionParams, actorUserId: number) {
        const data: Prisma.PermissionUncheckedCreateInput = {
            code: params.code,
            method: params.method,
            pathPattern: params.pathPattern,
            createdById: actorUserId,
        };

        if (params.code !== undefined) {
            data.code = params.code;
        }

        if (params.description !== undefined) {
            data.description = params.description;
        }

        if (params.isActive !== undefined) {
            data.isActive = params.isActive;
        }

        return this.prisma.permission.create({ data });
    }

    updatePermission(id: number, params: UpdatePermissionParams, actorUserId: number) {
        const data: Prisma.PermissionUncheckedUpdateInput = {
            updatedById: actorUserId,
        };

        if (params.code !== undefined) {
            data.code = params.code;
        }

        if (params.description !== undefined) {
            data.description = params.description;
        }

        if (params.method !== undefined) {
            data.method = params.method;
        }

        if (params.pathPattern !== undefined) {
            data.pathPattern = params.pathPattern;
        }

        if (params.isActive !== undefined) {
            data.isActive = params.isActive;
        }

        return this.prisma.permission.update({
            where: { id },
            data,
        });
    }

    softDeletePermission(id: number, actorUserId: number) {
        return this.prisma.permission.update({
            where: { id },
            data: {
                isActive: false,
                deletedAt: new Date(),
                updatedById: actorUserId,
            },
        });
    }
}

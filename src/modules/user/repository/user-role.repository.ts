import { PrismaService } from '@/database';
import { userRoleRoleSelect, userRoleWithUserAndRoleSelect } from '@/database/selects/user-role.select';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type UserRoleAuditOptions = {
    userIdBy?: number;
};

export type CreateUserRoleParams = {
    userId: number;
    roleId: number;
};

export type UpdateUserRoleParams = {
    userId: number;
    roleId: number;
    data?: Prisma.UserRoleUpdateInput;
};

export type DeleteUserRoleParams = {
    userId: number;
    roleId: number;
};

@Injectable()
export class UserRoleRepository {
    constructor(private readonly prisma: PrismaService) { }

    createUserRole(params: CreateUserRoleParams, options?: UserRoleAuditOptions) {
        return this.prisma.userRole.create({
            data: {
                userId: params.userId,
                roleId: params.roleId,
                createdBy: options?.userIdBy ?? undefined,
            },
        });
    }

    updateUserRole(params: UpdateUserRoleParams, options?: UserRoleAuditOptions) {
        const data: Prisma.UserRoleUpdateInput = { ...params.data };
        if (options?.userIdBy !== undefined) {
            data.updatedBy = options.userIdBy;
        }

        return this.prisma.userRole.update({
            where: {
                userId_roleId: {
                    userId: params.userId,
                    roleId: params.roleId,
                },
            },
            data,
        });
    }

    softDeleteUserRole(params: DeleteUserRoleParams, options?: UserRoleAuditOptions) {
        return this.prisma.userRole.update({
            where: {
                userId_roleId: {
                    userId: params.userId,
                    roleId: params.roleId,
                },
            },
            data: {
                deletedAt: new Date(),
                deletedBy: options?.userIdBy ?? undefined,
            },
        });
    }

    findRolesByUserId(userId: number) {
        return this.prisma.userRole.findMany({
            where: { userId, deletedAt: null },
            select: {
                role: { select: userRoleRoleSelect },
            },
        });
    }


    findUserRolesByUserId(userId: number) {
        return this.prisma.userRole.findMany({
            where: { userId, deletedAt: null },
            select: userRoleWithUserAndRoleSelect,
        });
    }
}

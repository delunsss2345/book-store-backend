import { PrismaService } from '@/database';
import { userRoleRoleSelect, userRoleWithUserAndRoleSelect } from '@/database/selects/user-role.select';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type UserRoleAuditOptions = {
    userIdBy?: bigint;
};

export type CreateUserRoleParams = {
    userId: bigint;
    roleId: bigint;
};

export type UpdateUserRoleParams = {
    userId: bigint;
    roleId: bigint;
    data?: Prisma.UserRoleUpdateInput;
};

export type DeleteUserRoleParams = {
    userId: bigint;
    roleId: bigint;
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

    findRolesByUserId(userId: bigint) {
        return this.prisma.userRole.findMany({
            where: { userId, deletedAt: null },
            select: {
                role: { select: userRoleRoleSelect },
            },
        });
    }

    findUserRolesByUserId(userId: bigint) {
        return this.prisma.userRole.findMany({
            where: { userId, deletedAt: null },
            select: userRoleWithUserAndRoleSelect,
        });
    }
}

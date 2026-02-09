import { Prisma } from '@prisma/client';

export const userRoleUserSelect = {
    id: true,
    email: true,
    phoneNumber: true,
    firstName: true,
    lastName: true,
    gender: true,
    avatarUrl: true,
    isEmailVerified: true,
    status: true,
} satisfies Prisma.UserSelect;

export const userRoleRoleSelect = {
    id: true,
    code: true,
    name: true,
    description: true,
    isActive: true,
} satisfies Prisma.RoleSelect;

export const userRoleWithUserAndRoleSelect = {
    userId: true,
    roleId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    createdBy: true,
    updatedBy: true,
    deletedBy: true,
    user: { select: userRoleUserSelect },
    role: { select: userRoleRoleSelect },
} satisfies Prisma.UserRoleSelect;

export type UserRoleWithUserAndRole = Prisma.UserRoleGetPayload<{
    select: typeof userRoleWithUserAndRoleSelect;
}>;

export type UserRoleUser = Prisma.UserGetPayload<{
    select: typeof userRoleUserSelect;
}>;

export type UserRoleRole = Prisma.RoleGetPayload<{
    select: typeof userRoleRoleSelect;
}>;

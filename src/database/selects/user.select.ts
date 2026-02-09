import { Prisma } from '@prisma/client';
export const userMeSelect = {
    id: true,
    email: true,
    phoneNumber: true,
    firstName: true,
    lastName: true,
    gender: true,
    avatarUrl: true,
    isEmailVerified: true,
    status: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;


export const userRoleSelect = {
    id: true,
    email: true,
    phoneNumber: true,
    firstName: true,
    lastName: true,
    gender: true,
    avatarUrl: true,
    isEmailVerified: true,
    status: true,
    password: true,
    userRoles: true
} satisfies Prisma.UserSelect

export type UserRole = Prisma.UserGetPayload<{ select: typeof userRoleSelect }>;
export type UserMe = Prisma.UserGetPayload<{ select: typeof userMeSelect }>;

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

export type UserMe = Prisma.UserGetPayload<{ select: typeof userMeSelect }>;

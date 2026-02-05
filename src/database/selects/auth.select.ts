import { Prisma } from "@prisma/client";

export const authUserSelect = {
    id: true,
    email: true,
    phoneNumber: true,
    firstName: true,
    lastName: true,
    gender: true,
    avatarUrl: true,
    isEmailVerified: true,
    status: true,
} satisfies Prisma.UserSelect

export const authUserSelectPassword = {
    id: true,
    email: true,
    phoneNumber: true,
    firstName: true,
    lastName: true,
    gender: true,
    avatarUrl: true,
    isEmailVerified: true,
    status: true,
    password: true
} satisfies Prisma.UserSelect

export type AuthMe = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;
export type AuthMeWithPassword = Prisma.UserGetPayload<{ select: typeof authUserSelectPassword }>;


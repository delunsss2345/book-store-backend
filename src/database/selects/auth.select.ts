import { Prisma } from "generated/prisma/browser";
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

export type AuthMe = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

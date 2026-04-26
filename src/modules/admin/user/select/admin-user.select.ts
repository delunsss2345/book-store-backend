import { Prisma } from '@prisma/client';

export const adminUserListSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  isEmailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  userRoles: {
    where: {
      deletedAt: null,
      role: {
        deletedAt: null,
        isActive: true,
      },
    },
    select: {
      role: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { adminUserListSelect } from './select';

@Injectable()
export class AdminUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  countUsers() {
    return this.prisma.user.count({
      where: {
        deletedAt: null,
      },
    });
  }

  countCustomersLoggedInSince(since: Date) {
    return this.prisma.user.count({
      where: {
        deletedAt: null,
        lastLoginAt: {
          gte: since,
        },
        userRoles: {
          some: {
            deletedAt: null,
            role: {
              deletedAt: null,
              isActive: true,
              code: RoleCode.CUSTOMER,
            },
          },
        },
      },
    });
  }

  findUsers(page: number, limit: number) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: adminUserListSelect,
    });
  }

  countNonCustomerUsers() {
    return this.prisma.user.count({
      where: {
        deletedAt: null,
        userRoles: {
          some: {
            deletedAt: null,
            role: {
              deletedAt: null,
              isActive: true,
              code: {
                not: RoleCode.CUSTOMER,
              },
            },
          },
        },
      },
    });
  }

  findNonCustomerUsers(page: number, limit: number) {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        userRoles: {
          some: {
            deletedAt: null,
            role: {
              deletedAt: null,
              isActive: true,
              code: {
                not: RoleCode.CUSTOMER,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: adminUserListSelect,
    });
  }
}

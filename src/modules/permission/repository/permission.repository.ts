import { PrismaClientTransaction, PrismaService } from '@/database';
import { CreatePermissionScanDto } from '@/modules/permission/dto/request';
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
  description?: string;
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
        },
      },
    });
  }

  async findPermissionByUserId(userId: number) {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
      },
      select: {
        role: {
          select: {
            code: true,
            roles: {
              select: {
                permission: {
                  select: {
                    code: true,
                    method: true,
                    pathPattern: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return userRoles.map((userRole) => ({
      role: {
        code: userRole.role.code,
        rolePermissions: userRole.role.roles,
      },
    }));
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

  updatePermission(
    id: number,
    params: UpdatePermissionParams,
    actorUserId: number,
  ) {
    const data: Prisma.PermissionUncheckedUpdateInput = {
      updatedById: actorUserId,
    };

    if (params.description !== undefined) {
      data.description = params.description;
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

  upsert(
    key: CreatePermissionScanDto,
    tx: PrismaClientTransaction = this.prisma,
  ) {
    return tx.permission.upsert({
      where: {
        method_pathPattern: {
          method: key.methodName as HTTPMethod,
          pathPattern: key.pathMetadata,
        },
      },
      create: {
        code: key.namePermission,
        method: key.methodName as HTTPMethod,
        pathPattern: key.pathMetadata,
      },
      update: {
        code: key.namePermission,
      },
    });
  }
}

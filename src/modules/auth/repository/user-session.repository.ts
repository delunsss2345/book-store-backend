import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma, SessionStatus, UserSession } from '@prisma/client';

@Injectable()
export class UserSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  createUserSession(
    data: Prisma.UserSessionUncheckedCreateInput,
  ): Promise<UserSession> {
    return this.prisma.userSession.create({ data });
  }

  findByRefreshTokenHash(
    refreshTokenHash: string,
  ): Promise<UserSession | null> {
    return this.prisma.userSession.findUnique({ where: { refreshTokenHash } });
  }

  updateUserSession(
    id: string,
    data: Prisma.UserSessionUpdateInput,
  ): Promise<UserSession> {
    return this.prisma.userSession.update({ where: { id }, data });
  }

  findActiveSessionsByUserId(userId: number) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        status: SessionStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        deviceId: true,
        ip: true,
        status: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true,
        device: {
          select: {
            id: true,
            userId: true,
            deviceFingerprint: true,
            deviceName: true,
            platform: true,
            osVersion: true,
            appVersion: true,
            isTrusted: true,
            firstSeenAt: true,
            lastSeenAt: true,
            revokedAt: true,
          },
        },
      },
    });
  }
}

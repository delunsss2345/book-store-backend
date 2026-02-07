import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma, UserSession } from '@prisma/client';

@Injectable()
export class UserSessionRepository {
    constructor(private readonly prisma: PrismaService) { }

    createUserSession(data: Prisma.UserSessionUncheckedCreateInput): Promise<UserSession> {
        return this.prisma.userSession.create({ data });
    }

    findByRefreshTokenHash(refreshTokenHash: string): Promise<UserSession | null> {
        return this.prisma.userSession.findUnique({ where: { refreshTokenHash } });
    }

    updateUserSession(id: string, data: Prisma.UserSessionUpdateInput): Promise<UserSession> {
        return this.prisma.userSession.update({ where: { id }, data });
    }
}

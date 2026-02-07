import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma, UserSession } from '@prisma/client';

@Injectable()
export class UserSessionRepository {
    constructor(private readonly prisma: PrismaService) { }

    createUserSession(data: Prisma.UserSessionUncheckedCreateInput): Promise<UserSession> {
        return this.prisma.userSession.create({ data });
    }
}

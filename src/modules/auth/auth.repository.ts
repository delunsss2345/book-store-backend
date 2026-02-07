import { PrismaService } from '@/database';
import { AuthMe, AuthMeWithPassword, authUserSelect, authUserSelectPassword } from '@/database/selects/auth.select';
import { Injectable } from '@nestjs/common';
import { Prisma, User, UserSession } from '@prisma/client';

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) { }

    createUser(data: Prisma.UserCreateInput): Promise<AuthMe> {
        return this.prisma.user.create({ select: authUserSelect, data });
    }

    findUserByEmail(email: string): Promise<AuthMe | null> {
        return this.prisma.user.findUnique({
            select: authUserSelect,
            where: { email }
        });
    }
    findUserById(id: bigint): Promise<AuthMe | null> {
        return this.prisma.user.findFirst({
            select: authUserSelect,
            where: { id }
        });
    }

    findAuthByEmailPassword(email: string): Promise<AuthMeWithPassword | null> {
        return this.prisma.user.findUnique({
            select: authUserSelectPassword,
            where: { email }
        });
    }

    existsEmail(email: string): Promise<boolean> {
        return this.prisma.user
            .findUnique({ where: { email }, select: { id: true } })
            .then(Boolean);
    }

    updateLastLogin(userId: bigint): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        });
    }

    markEmailVerified(userId: bigint): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                verifyEmailAt: new Date(),
            },
        });
    }

    updatePassword(userId: bigint, password: string): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                password,
                passwordChangedAt: new Date(),
            },
        });
    }

    updateProfile(
        userId: bigint,
        data: Pick<Prisma.UserUpdateInput, 'firstName' | 'lastName' | 'gender' | 'avatarUrl' | 'phoneNumber'>,
    ): Promise<User> {
        return this.prisma.user.update({
            where: { id: userId },
            data,
        });
    }

    createUserSession(data: Prisma.UserSessionUncheckedCreateInput): Promise<UserSession> {
        return this.prisma.userSession.create({ data });
    }
}

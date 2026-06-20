import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma, UserDevice } from '@prisma/client';

@Injectable()
export class UserDeviceRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByUserIdAndFingerprint(userId: number, deviceFingerprint: string): Promise<UserDevice | null> {
        return this.prisma.userDevice.findUnique({
            where: {
                userId_deviceFingerprint: {
                    userId,
                    deviceFingerprint,
                },
            },
        });
    }

    countActiveByUserId(userId: number): Promise<number> {
        return this.prisma.userDevice.count({
            where: {
                userId,
                revokedAt: null,
            },
        });
    }

    async revokeOldestActiveDevice(userId: number) {
        const oldest = await this.prisma.userDevice.findFirst({
            where: {
                userId,
                revokedAt: null,
            },
            orderBy: {
                lastSeenAt: 'asc',
            },
        });
        if (!oldest) return null;
        return this.prisma.userDevice.update({
            where: { id: oldest.id },
            data: { revokedAt: new Date() },
        });
    }

    createUserDevice(data: Prisma.UserDeviceUncheckedCreateInput): Promise<UserDevice> {
        return this.prisma.userDevice.create({ data });
    }

    updateUserDevice(id: number, data: Prisma.UserDeviceUpdateInput): Promise<UserDevice> {
        return this.prisma.userDevice.update({ where: { id }, data });
    }

    findManyByUserId(userId: number) {
        return this.prisma.userDevice.findMany({
            where: { userId },
            orderBy: { lastSeenAt: 'desc' },
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
                sessions: {
                    orderBy: { createdAt: 'desc' },
                    take: 3,
                    select: {
                        id: true,
                        createdAt: true,
                        status: true,
                        expiresAt: true,
                        revokedAt: true,
                        userAgent: true,
                    },
                },
            },
        });
    }
}

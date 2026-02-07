import { Injectable } from '@nestjs/common';
import { UserDevice } from '@prisma/client';
import { parseUserAgent } from '@/utils/parseUserAgent.utils';
import { UserDeviceRepository } from './user-device.repository';

const MAX_DEVICES = 4;

@Injectable()
export class UserDeviceService {
    constructor(private readonly userDeviceRepository: UserDeviceRepository) { }

    async upsertDeviceOnLogin(params: {
        userId: bigint;
        deviceFingerprint: string;
        userAgent?: string | null;
    }): Promise<UserDevice> {
        const now = new Date();
        const { deviceName, osVersion, appVersion, platform } = parseUserAgent(params.userAgent);

        const existing = await this.userDeviceRepository.findByUserIdAndFingerprint(
            params.userId,
            params.deviceFingerprint,
        );

        if (existing && !existing.revokedAt) {
            return this.userDeviceRepository.updateUserDevice(existing.id, {
                deviceName: deviceName ?? undefined,
                osVersion: osVersion ?? undefined,
                appVersion: appVersion ?? undefined,
                platform: platform ?? undefined,
                lastSeenAt: now,
                firstSeenAt: existing.firstSeenAt ?? now,
            });
        }

        const activeCount = await this.userDeviceRepository.countActiveByUserId(params.userId);
        if (activeCount >= MAX_DEVICES) {
            await this.userDeviceRepository.revokeOldestActiveDevice(params.userId);
        }

        if (existing) {
            return this.userDeviceRepository.updateUserDevice(existing.id, {
                deviceName: deviceName ?? undefined,
                osVersion: osVersion ?? undefined,
                appVersion: appVersion ?? undefined,
                platform: platform ?? undefined,
                revokedAt: null,
                lastSeenAt: now,
                firstSeenAt: existing.firstSeenAt ?? now,
            });
        }

        return this.userDeviceRepository.createUserDevice({
            userId: params.userId,
            deviceFingerprint: params.deviceFingerprint,
            deviceName: deviceName ?? undefined,
            osVersion: osVersion ?? undefined,
            appVersion: appVersion ?? undefined,
            platform: platform ?? undefined,
            firstSeenAt: now,
            lastSeenAt: now,
        });
    }

    listDevices(userId: bigint) {
        return this.userDeviceRepository.findManyByUserId(userId);
    }
}

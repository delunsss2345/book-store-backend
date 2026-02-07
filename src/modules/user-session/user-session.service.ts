import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hashToken } from '@/utils/hashToken.utils';
import { UserSessionRepository } from './user-session.repository';

@Injectable()
export class UserSessionService {
    constructor(
        private readonly userSessionRepository: UserSessionRepository,
        private readonly configService: ConfigService,
    ) { }

    async createSession(params: {
        userId: bigint;
        refreshToken: string;
        userAgent?: string;
        deviceId?: bigint | null;
    }) {
        const refreshTokenHash = await hashToken(params.refreshToken);
        const expiresAt = this.getRefreshTokenExpiresAt();

        return this.userSessionRepository.createUserSession({
            userId: params.userId,
            deviceId: params.deviceId ?? undefined,
            refreshTokenHash,
            userAgent: params.userAgent,
            expiresAt,
        });
    }

    private getRefreshTokenExpiresAt() {
        const refreshTokenSeconds = Number(this.configService.get('REFRESH_TOKEN_TIME'));
        if (!Number.isFinite(refreshTokenSeconds)) {
            throw new Error('Invalid REFRESH_TOKEN_TIME config');
        }
        return new Date(Date.now() + refreshTokenSeconds * 1000);
    }
}

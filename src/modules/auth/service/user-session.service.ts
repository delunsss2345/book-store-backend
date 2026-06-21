import { hashToken } from '@/utils/hashToken.util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionStatus } from '@prisma/client';
import { UserSessionRepository } from '../repository/user-session.repository';

@Injectable()
export class UserSessionService {
    constructor(
        private readonly userSessionRepository: UserSessionRepository,
        private readonly configService: ConfigService,
    ) { }

    async createSession(params: {
        userId: number;
        ip: string | null;
        refreshToken: string;
        userAgent?: string;
        deviceId?: number | null;
    }) {

        const refreshTokenHash = hashToken(params.refreshToken);
        const expiresAt = this.getRefreshTokenExpiresAt();

        return this.userSessionRepository.createUserSession({
            userId: params.userId,
            deviceId: params.deviceId ?? undefined,
            ip: params?.ip ?? undefined,
            refreshTokenHash,
            userAgent: params.userAgent,
            expiresAt,
        });
    }

    findByRefreshTokenHash(refreshTokenHash: string) {
        return this.userSessionRepository.findByRefreshTokenHash(refreshTokenHash);
    }

    async rotateSession(params: {
        sessionId: string;
        refreshToken: string;
        userAgent?: string | null;
    }) {
        const refreshTokenHash = hashToken(params.refreshToken);
        const expiresAt = this.getRefreshTokenExpiresAt();
        return this.userSessionRepository.updateUserSession(params.sessionId, {
            refreshTokenHash,
            expiresAt,
            status: SessionStatus.ACTIVE,
            revokedAt: null,
            userAgent: params.userAgent ?? undefined,
        });
    }

    markSessionExpired(sessionId: string) {
        return this.userSessionRepository.updateUserSession(sessionId, {
            status: SessionStatus.EXPIRED,
            revokedAt: new Date(),
        });
    }

    async revokeSessionByRefreshToken(refreshToken: string) {
        const refreshTokenHash = hashToken(refreshToken);
        const session = await this.userSessionRepository.findByRefreshTokenHash(refreshTokenHash);
        if (!session) return null;
        return this.userSessionRepository.updateUserSession(session.id, {
            status: SessionStatus.REVOKED,
            revokedAt: new Date(),
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

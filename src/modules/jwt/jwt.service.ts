import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';

export type JwtPayload = {
    sub: string;
    roles?: string[];
    isVerify: boolean;
};

export type TokenPair = {
    accessToken: string;
    refreshToken: string;
};

@Injectable()
export class JwtAuthService {
    constructor(
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) { }

    signAccessToken(payload: JwtPayload, options?: JwtSignOptions): string {
        return this.jwt.sign(payload, options);
    }

    verifyAccessToken(token: string, options?: JwtVerifyOptions): JwtPayload {
        return this.jwt.verify(token, options);
    }

    decode<T = any>(token: string): T | null {
        return this.jwt.decode(token);
    }

    // ===== Helpers =====
    private getRefreshExpiresIn(): number | string {
        const v = this.config.get('REFRESH_TOKEN_TIME');
        const n = Number(v);
        return Number.isFinite(n) ? n : (v as string);
    }
}

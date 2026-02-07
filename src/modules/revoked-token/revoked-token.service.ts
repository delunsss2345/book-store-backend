import { Injectable } from '@nestjs/common';
import { RevokedTokenRepository } from './revoked-token.repository';

@Injectable()
export class RevokedTokenService {
    constructor(private readonly revokedTokenRepository: RevokedTokenRepository) { }

    revokeToken(tokenHash: string, expiresAt: Date) {
        return this.revokedTokenRepository.upsertRevokedToken(tokenHash, expiresAt);
    }

    isRevoked(tokenHash: string) {
        return this.revokedTokenRepository.existsByHash(tokenHash);
    }
}

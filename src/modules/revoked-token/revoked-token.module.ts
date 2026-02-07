import { Module } from '@nestjs/common';
import { RevokedTokenRepository } from './revoked-token.repository';
import { RevokedTokenService } from './revoked-token.service';

@Module({
    providers: [RevokedTokenService, RevokedTokenRepository],
    exports: [RevokedTokenService, RevokedTokenRepository],
})
export class RevokedTokenModule { }

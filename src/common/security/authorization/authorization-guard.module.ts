import { AuthGuard } from '@/common/security/guard/auth.guard';
import { JwtProvider } from '@/config/jwt.config';
import { RevokedTokenRepository } from '@/modules/auth/repository/revoked-token.repository';
import { RevokedTokenService } from '@/modules/auth/service/revoked-token.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [JwtProvider],
    providers: [AuthGuard, RevokedTokenService, RevokedTokenRepository],
    exports: [AuthGuard],
})
export class AuthGuardModule { }

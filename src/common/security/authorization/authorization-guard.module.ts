import { AuthGuard } from '@/common/security/guard/auth.guard';
import { JwtProvider } from '@/config/jwt.config';
import { RevokedTokenModule } from '@/modules/revoked-token/revoked-token.module';
import { Module } from '@nestjs/common';

@Module({
    imports: [JwtProvider, RevokedTokenModule],
    providers: [AuthGuard],
    exports: [AuthGuard],
})
export class AuthGuardModule { }

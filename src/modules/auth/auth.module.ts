import { RefreshGuard } from '@/common/security/guard/refresh.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthRepository } from '@/modules/auth/repository/auth.repository';
import { RevokedTokenRepository } from '@/modules/auth/repository/revoked-token.repository';
import { UserSessionRepository } from '@/modules/auth/repository/user-session.repository';
import { RevokedTokenService } from '@/modules/auth/service/revoked-token.service';
import { UserSessionService } from '@/modules/auth/service/user-session.service';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { LoginAttemptModule } from '@/modules/login-attempt/login-attempt.module';
import { RoleModule } from '@/modules/role/role.module';
import { UserDeviceModule } from '@/modules/user-device/user-device.module';
import { UserModule } from '@/modules/user/user.module';
import { VerificationCodeModule } from '@/modules/verification-code/verification-code.module';
import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
@Module({
    imports: [
        JwtProvider,
        VerificationCodeModule,
        EmailOutboxModule,
        LoginAttemptModule,
        GuestSessionModule,
        UserDeviceModule,
        JobsModule,
        UserModule,
        RoleModule
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AuthRepository,
        RefreshGuard,
        UserSessionService,
        UserSessionRepository,
        RevokedTokenService,
        RevokedTokenRepository,
    ],
    exports: [AuthService],
})
export class AuthModule { }

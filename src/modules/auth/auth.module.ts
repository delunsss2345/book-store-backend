import { RefreshGuard } from '@/common/security/guard/refresh.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { LoginAttemptModule } from '@/modules/login-attempt/login-attempt.module';
import { RevokedTokenModule } from '@/modules/revoked-token/revoked-token.module';
import { RoleModule } from '@/modules/role/role.module';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { UserDeviceModule } from '@/modules/user-device/user-device.module';
import { UserRoleModule } from '@/modules/user-role/user-role.module';
import { UserSessionModule } from '@/modules/user-session/user-session.module';
import { VerificationCodeModule } from '@/modules/verification-code/verification-code.module';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
@Module({
    imports: [
        JwtProvider,
        VerificationCodeModule,
        EmailOutboxModule,
        LoginAttemptModule,
        GuestSessionModule,
        UserSessionModule,
        RevokedTokenModule,
        UserDeviceModule,
        JobsModule,
        UserRoleModule,
        RoleModule
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository, RefreshGuard],

})
export class AuthModule { }

import { RefreshGuard } from '@/common/security/guard/refresh.guard';
import { JwtProvider } from '@/config/jwt.config';
import { LoginAttemptRepository } from '@/modules/auth/repository/login-attempt.repository';
import { AuthRepository } from '@/modules/auth/repository/auth.repository';
import { RevokedTokenRepository } from '@/modules/auth/repository/revoked-token.repository';
import { UserDeviceRepository } from '@/modules/auth/repository/user-device.repository';
import { UserSessionRepository } from '@/modules/auth/repository/user-session.repository';
import { LoginAttemptService } from '@/modules/auth/service/login-attempt.service';
import { RevokedTokenService } from '@/modules/auth/service/revoked-token.service';
import { UserDeviceService } from '@/modules/auth/service/user-device.service';
import { UserSessionService } from '@/modules/auth/service/user-session.service';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { RoleModule } from '@/modules/role/role.module';
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
    GuestSessionModule,
    JobsModule,
    UserModule,
    RoleModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    RefreshGuard,
    LoginAttemptService,
    LoginAttemptRepository,
    UserDeviceService,
    UserDeviceRepository,
    UserSessionService,
    UserSessionRepository,
    RevokedTokenService,
    RevokedTokenRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}

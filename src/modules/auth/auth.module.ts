import { AuthGuard } from '@/common/guard/auth.guard';
import { RefreshGuard } from '@/common/guard/refresh.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { LoginAttemptModule } from '@/modules/login-attempt/login-attempt.module';
import { RevokedTokenModule } from '@/modules/revoked-token/revoked-token.module';
import { UserDeviceModule } from '@/modules/user-device/user-device.module';
import { UserSessionModule } from '@/modules/user-session/user-session.module';
import { VerificationCodeModule } from '@/modules/verification-code/verification-code.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
@Module({
    imports: [JwtProvider, VerificationCodeModule, LoginAttemptModule, UserSessionModule, RevokedTokenModule, UserDeviceModule, JobsModule],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository, RefreshGuard, { provide: APP_GUARD, useClass: AuthGuard }],

})
export class AuthModule { }

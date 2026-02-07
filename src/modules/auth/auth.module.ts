import { AuthGuard } from '@/common/guard/auth.guard';
import { RefreshGuard } from '@/common/guard/refresh.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { LoginAttemptModule } from '@/modules/login-attempt/login-attempt.module';
import { UserSessionModule } from '@/modules/user-session/user-session.module';
import { VerificationCodeModule } from '@/modules/verification-code/verification-code.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
@Module({
    imports: [JwtProvider, VerificationCodeModule, LoginAttemptModule, UserSessionModule],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository, RefreshGuard, { provide: APP_GUARD, useClass: AuthGuard }],

})
export class AuthModule { }

import { JwtProvider } from '@/config/jwt.config';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { VerificationCodeModule } from '@/modules/verification-code/verification-code.module';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
@Module({
    imports: [JwtProvider, VerificationCodeModule],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository],
})
export class AuthModule { }

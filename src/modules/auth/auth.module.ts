import { JwtProvider } from '@/config/jwt.config';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
@Module({
    imports: [JwtProvider],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository],
})
export class AuthModule { }

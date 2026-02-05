import { UserAgent } from '@/common/decorators/userAgent.decorator';
import {
    ForgotPasswordBodyDTO, LoginBodyDTO, LogoutBodyDTO,
    RefreshTokenBodyDTO, RegisterBodyDTO,
    ResendVerifyEmailBodyDTO, VerifyEmailBodyDTO
} from '@/modules/auth/dto';
import { Body, Controller, Ip, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    @Post('register')
    register(@Body() body: RegisterBodyDTO) {

    }

    @Post('login')
    login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    }

    @Post('refresh-token')
    refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    }

    @Post('logout')
    logout(@Body() body: LogoutBodyDTO) {
    }

    @Post('forgot-password')
    forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    }

    @Post('verify-email')
    verifyEmail(@Body() body: VerifyEmailBodyDTO) {
    }

    @Post('resend-verify-email')
    resendVerifyEmail(@Body() body: ResendVerifyEmailBodyDTO) {
    }
}   

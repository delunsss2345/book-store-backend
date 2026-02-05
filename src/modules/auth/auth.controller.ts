import { AuthService } from '@/modules/auth/auth.service';
import {
    RegisterBodyDTO
} from '@/modules/auth/dto';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }
    @Post('register')
    register(@Body() body: RegisterBodyDTO) {
        return this.authService.register(body);
    }

    // @Post('login')
    // login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    // }

    // @Post('refresh-token')
    // refreshToken(@Body() body: RefreshTokenBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
    // }

    // @Post('logout')
    // logout(@Body() body: LogoutBodyDTO) {
    // }

    // @Post('forgot-password')
    // forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    // }

    // @Post('verify-email')
    // verifyEmail(@Body() body: VerifyEmailBodyDTO) {
    // }

    // @Post('resend-verify-email')
    // resendVerifyEmail(@Body() body: ResendVerifyEmailBodyDTO) {
    // }
}   

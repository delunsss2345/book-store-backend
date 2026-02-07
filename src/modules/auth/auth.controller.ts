import { GetUser } from '@/common/decorators/getUser.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { RefreshSession } from '@/common/decorators/refresh-session.decorator';
import { Refresh } from '@/common/decorators/refresh.decorator';
import { UserAgent } from '@/common/decorators/userAgent.decorator';
import { RefreshGuard } from '@/common/guard/refresh.guard';
import { AuthService } from '@/modules/auth/auth.service';
import {
    LoginBodyDTO,
    RefreshTokenBodyDTO,
    RegisterBodyDTO
} from '@/modules/auth/dto/request';
import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, UseGuards } from '@nestjs/common';
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }
    @Public()
    @Post('register')
    register(@Body() body: RegisterBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
        return this.authService.register(body, userAgent, ip);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() body: LoginBodyDTO, @UserAgent() userAgent: string, @Ip() ip: string) {
        return this.authService.login(body, userAgent, ip)
    }


    @Get('me')
    me(@GetUser() user) {
        console.log(user);
        return this.authService.getMe(user.sub);
    }
    @Refresh()
    @UseGuards(RefreshGuard)
    @Post('refresh-token')
    refreshToken(@RefreshSession() session, @UserAgent() userAgent, @Body() body: RefreshTokenBodyDTO) {
        return this.authService.refreshToken(body, userAgent, session);
    }

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

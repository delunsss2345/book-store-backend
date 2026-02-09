import { ResponseDto } from '@/common';
import { GetAccessToken } from '@/common/decorators/getAccessToken.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { RefreshSession } from '@/common/decorators/refresh-session.decorator';
import { Refresh } from '@/common/decorators/refresh.decorator';
import { UserAgent } from '@/common/decorators/userAgent.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RefreshGuard } from '@/common/guard/refresh.guard';
import { AuthService } from '@/modules/auth/auth.service';
import {
    ChangePasswordRequestDto,
    LoginRequestDto,
    LogoutRequestDto,
    RegisterRequestDto,
    ResendVerifyEmailRequestDto,
    VerifyEmailRequestDto
} from '@/modules/auth/dto/request';
import { ChangePasswordResponseDto } from '@/modules/auth/dto/response/changePassword.response.dto';
import { LoginResponseDto } from '@/modules/auth/dto/response/login.response.dto';
import { RegisterResponseDto } from '@/modules/auth/dto/response/register.response.dto';
import { ResendEmailResponseDto } from '@/modules/auth/dto/response/resendEmail.response.dto';
import { VerifyEmailResponseDto } from '@/modules/auth/dto/response/verifyEmail.response.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse } from '@nestjs/swagger';
import type { UserSession } from '@prisma/client';
import type { CookieOptions, Request, Response } from 'express';
import { v4 } from 'uuid';

const DEVICE_FINGERPRINT_COOKIE = 'device_fingerprint';
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
    }
    @Public()
    @Post('register')
    @ApiOkResponse({ type: ResponseDto<RegisterResponseDto> })
    register(@Body() body: RegisterRequestDto, @UserAgent() userAgent: string, @Ip() ip: string) {
        return this.authService.register(body, userAgent, ip);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOkResponse({ type: ResponseDto<LoginResponseDto> })
    login(
        @Body() body: LoginRequestDto,
        @UserAgent() userAgent: string,
        @Ip() ip: string,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        // Check cookie 
        const cookieFp = req.cookies?.[DEVICE_FINGERPRINT_COOKIE];
        const deviceFingerprint = body.deviceFingerprint || cookieFp || v4();

        if (!cookieFp) {
            res.cookie(DEVICE_FINGERPRINT_COOKIE, deviceFingerprint, this.getDeviceFingerprintCookieOptions());
        }

        return this.authService.login({ ...body, deviceFingerprint }, userAgent, ip)
    }


    @Get('me')
    me(@GetUser() user: JwtPayload) {
        return this.authService.getMe(BigInt(user.sub));
    }
    @Refresh()
    @UseGuards(RefreshGuard)
    @Post('refresh-token')
    refreshToken(@RefreshSession() session: UserSession, @UserAgent() userAgent: string) {
        return this.authService.refreshToken(userAgent, session);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@GetAccessToken() accessToken: string, @Body() body: LogoutRequestDto) {
        return this.authService.logout({ accessToken, ...body });
    }

    // @Post('forgot-password')
    // forgotPassword(@Body() body: ForgotPasswordRequestDto) {
    // }

    @Public()
    @Get('verify-email')
    @ApiOkResponse({ type: ResponseDto<VerifyEmailResponseDto> })
    verifyEmail(@Query() query: VerifyEmailRequestDto) {
        return this.authService.verifyEmail(query);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('resend-email')
    @ApiOkResponse({ type: ResponseDto<ResendEmailResponseDto> })
    resendEmail(@Body() body: ResendVerifyEmailRequestDto) {
        return this.authService.resendEmail(body);
    }

    @HttpCode(HttpStatus.OK)
    @Post('change-password')
    @ApiOkResponse({ type: ResponseDto<ChangePasswordResponseDto> })
    changePassword(@GetUser() user: JwtPayload, @Body() body: ChangePasswordRequestDto) {
        return this.authService.changePassword(BigInt(user.sub), body);
    }

    private getDeviceFingerprintCookieOptions(): CookieOptions {
        const isDev = !!this.configService.get('IS_DEV');
        const refreshTokenSeconds = Number(this.configService.get('REFRESH_TOKEN_TIME'));
        const options: CookieOptions = {
            httpOnly: true,
            sameSite: 'lax',
            secure: !isDev,
            path: '/',
        };

        if (Number.isFinite(refreshTokenSeconds)) {
            options.maxAge = refreshTokenSeconds * 1000;
        }

        return options;
    }
}

import { ResponseDto } from '@/common';
import { GetAccessToken } from '@/common/decorators/getAccessToken.decorator';
import { GetOriginUrl } from '@/common/decorators/getOrginUrl.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { UserAgent } from '@/common/decorators/userAgent.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { Public } from '@/common/security/decorators/public.decorator';
import { RefreshSession } from '@/common/security/decorators/refresh-session.decorator';
import { Refresh } from '@/common/security/decorators/refresh.decorator';
import { RefreshGuard } from '@/common/security/guard/refresh.guard';
import { AuthService } from '@/modules/auth/auth.service';
import {
    ChangePasswordRequestDto,
    ForgotPasswordRequestDto,
    LoginRequestDto,
    LogoutRequestDto,
    RegisterRequestDto,
    ResendVerifyEmailRequestDto,
    ResetPasswordRequestDto,
    ResetPasswordValidateRequestDto,
    VerifyEmailRequestDto
} from '@/modules/auth/dto/request';
import { ChangePasswordResponseDto } from '@/modules/auth/dto/response/changePassword.response.dto';
import { ForgotPasswordResponseDto } from '@/modules/auth/dto/response/forgotPassword.response.dto';
import { LoginResponseDto } from '@/modules/auth/dto/response/login.response.dto';
import { RegisterResponseDto } from '@/modules/auth/dto/response/register.response.dto';
import { ResendEmailResponseDto } from '@/modules/auth/dto/response/resendEmail.response.dto';
import { ResetPasswordResponseDto } from '@/modules/auth/dto/response/resetPassword.response.dto';
import { ResetPasswordValidateResponseDto } from '@/modules/auth/dto/response/resetPasswordValidate.response.dto';
import { VerifyEmailResponseDto } from '@/modules/auth/dto/response/verifyEmail.response.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
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
    register(
        @Body() body: RegisterRequestDto,
        @UserAgent() userAgent: string,
        @Ip() ip: string,
        @Req() req: Request,
    ) {
        const guestSessionId = req.cookies?.guestSessionId as string | undefined;
        return this.authService.register(body, userAgent, ip, guestSessionId);
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
    @ApiBearerAuth('access-token')
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
    @ApiBearerAuth('access-token')
    logout(@GetAccessToken() accessToken: string, @Body() body: LogoutRequestDto) {
        return this.authService.logout({ accessToken, ...body });
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('forgot-password')
    @ApiOkResponse({ type: ResponseDto<ForgotPasswordResponseDto> })
    forgotPassword(@Body() body: ForgotPasswordRequestDto) {
        return this.authService.forgotPassword(body);
    }

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
    resendEmail(@GetOriginUrl() url, @Body() body: ResendVerifyEmailRequestDto) {
        return this.authService.resendEmail(body, url);
    }

    @HttpCode(HttpStatus.OK)
    @Post('change-password')
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: ResponseDto<ChangePasswordResponseDto> })
    changePassword(@GetUser() user: JwtPayload, @Body() body: ChangePasswordRequestDto) {
        return this.authService.changePassword(BigInt(user.sub), body);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('reset-password/validate')
    @ApiOkResponse({ type: ResponseDto<ResetPasswordValidateResponseDto> })
    validateResetPassword(@Body() body: ResetPasswordValidateRequestDto) {
        return this.authService.validateResetPasswordToken(body);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('reset-password')
    @ApiOkResponse({ type: ResponseDto<ResetPasswordResponseDto> })
    resetPassword(@Body() body: ResetPasswordRequestDto) {
        return this.authService.resetPassword(body);
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

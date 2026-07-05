import { ResponseDto } from '@/common';
import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetAccessToken } from '@/common/decorators/getAccessToken.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { UserAgent } from '@/common/decorators/userAgent.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { Public } from '@/common/security/decorators/public.decorator';
import { RefreshSession } from '@/common/security/decorators/refresh-session.decorator';
import { Refresh } from '@/common/security/decorators/refresh.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { RefreshGuard } from '@/common/security/guard/refresh.guard';
import {
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResendVerifyEmailRequestDto,
  ResetPasswordRequestDto,
  ResetPasswordValidateRequestDto,
  VerifyEmailRequestDto,
} from '@/modules/auth/dto/request';
import { ChangePasswordResponseDto } from '@/modules/auth/dto/response/changePassword.response.dto';
import { ForgotPasswordResponseDto } from '@/modules/auth/dto/response/forgotPassword.response.dto';
import { LoginResponseDto } from '@/modules/auth/dto/response/login.response.dto';
import { RegisterResponseDto } from '@/modules/auth/dto/response/register.response.dto';
import { ResendEmailResponseDto } from '@/modules/auth/dto/response/resendEmail.response.dto';
import { ResetPasswordResponseDto } from '@/modules/auth/dto/response/resetPassword.response.dto';
import { ResetPasswordValidateResponseDto } from '@/modules/auth/dto/response/resetPasswordValidate.response.dto';
import { UserSessionResponseDto } from '@/modules/auth/dto/response/user-session.response.dto';
import { VerifyEmailResponseDto } from '@/modules/auth/dto/response/verifyEmail.response.dto';
import { AuthService } from '@/modules/auth/service/auth.service';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { UserSession } from '@prisma/client';
import type { CookieOptions, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const DEVICE_FINGERPRINT_COOKIE = 'device_fingerprint';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ type: ResponseDto<RegisterResponseDto> })
  register(
    @Body() body: RegisterRequestDto,
    @UserAgent() userAgent: string,
    @Ip() ip: string,
    @Headers('x-origin-url') originUrl: string | undefined,
    @Req() req: Request,
  ) {
    const guestSessionId = req.cookies?.guestSessionId as string | undefined;
    return this.authService.register(
      body,
      userAgent,
      ip,
      originUrl,
      guestSessionId,
    );
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
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
    const deviceFingerprint =
      body.deviceFingerprint || cookieFp || randomUUID();

    if (!cookieFp) {
      res.cookie(
        DEVICE_FINGERPRINT_COOKIE,
        deviceFingerprint,
        this.getDeviceFingerprintCookieOptions(),
      );
    }

    return this.authService.login(
      { ...body, deviceFingerprint },
      userAgent,
      ip,
    );
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiOkResponse({ type: ResponseDto })
  me(@GetUser() user: JwtPayload) {
    return this.authService.getMe(Number(user.sub));
  }

  @Get('device/:userId')
  @RequirePermissions(PermissionCode.DEVICE_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get active device sessions for a user' })
  @ApiParam({ name: 'userId', type: Number, description: 'ID of the user' })
  @ApiOkResponse({ type: [UserSessionResponseDto] })
  getActiveDeviceSessions(@Param('userId', ParseIntPipe) userId: number) {
    return this.authService.getActiveDeviceSessions(userId);
  }

  @Refresh()
  @UseGuards(RefreshGuard)
  @Post('refresh-token')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiHeader({ name: 'x-refresh-token', required: true })
  @ApiOkResponse({ type: ResponseDto<LoginResponseDto> })
  refreshToken(
    @RefreshSession() session: UserSession,
    @UserAgent() userAgent: string,
  ) {
    return this.authService.refreshToken(userAgent, session);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and revoke the current session' })
  @ApiHeader({ name: 'x-refresh-token', required: true })
  @ApiOkResponse({ type: ResponseDto })
  logout(
    @GetAccessToken() accessToken: string,
    @Headers('x-refresh-token') refreshToken: string,
  ) {
    return this.authService.logout({ accessToken, refreshToken });
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send a password reset email to the user' })
  @ApiOkResponse({ type: ResponseDto<ForgotPasswordResponseDto> })
  forgotPassword(
    @Headers('x-origin-url') originUrl: string | undefined,
    @Body() body: ForgotPasswordRequestDto,
  ) {
    return this.authService.forgotPassword(body, originUrl);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify user email address using a token' })
  @ApiOkResponse({ type: ResponseDto<VerifyEmailResponseDto> })
  verifyEmail(@Query() query: VerifyEmailRequestDto) {
    return this.authService.verifyEmail(query);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('resend-email')
  @ApiOperation({ summary: 'Resend the email verification link' })
  @ApiOkResponse({ type: ResponseDto<ResendEmailResponseDto> })
  resendEmail(
    @Headers('x-origin-url') originUrl: string | undefined,
    @Body() body: ResendVerifyEmailRequestDto,
  ) {
    return this.authService.resendEmail(body, originUrl);
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiOkResponse({ type: ResponseDto<ChangePasswordResponseDto> })
  changePassword(
    @GetUser() user: JwtPayload,
    @Body() body: ChangePasswordRequestDto,
  ) {
    return this.authService.changePassword(Number(user.sub), body);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password/validate')
  @ApiOperation({ summary: 'Validate a password reset token' })
  @ApiOkResponse({ type: ResponseDto<ResetPasswordValidateResponseDto> })
  validateResetPassword(@Body() body: ResetPasswordValidateRequestDto) {
    return this.authService.validateResetPasswordToken(body);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset the user password using a valid reset token',
  })
  @ApiOkResponse({ type: ResponseDto<ResetPasswordResponseDto> })
  resetPassword(@Body() body: ResetPasswordRequestDto) {
    return this.authService.resetPassword(body);
  }

  private getDeviceFingerprintCookieOptions(): CookieOptions {
    const isDev = !!this.configService.get('IS_DEV');
    const refreshTokenSeconds = Number(
      this.configService.get('REFRESH_TOKEN_TIME'),
    );
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

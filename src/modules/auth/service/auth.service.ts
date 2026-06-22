import {
  ChangePasswordMessage,
  ForgotPasswordMessage,
  LoginMessage,
  RegisterMessage,
} from '@/common';
import { JwtPayload } from '@/common/dto/jwt.dto';
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
import { AuthRepository } from '@/modules/auth/repository/auth.repository';
import { LoginAttemptService } from '@/modules/auth/service/login-attempt.service';
import { RevokedTokenService } from '@/modules/auth/service/revoked-token.service';
import { UserDeviceService } from '@/modules/auth/service/user-device.service';
import { UserSessionService } from '@/modules/auth/service/user-session.service';
import { EmailOutboxService } from '@/modules/email-outbox/service/email-outbox.service';
import { GuestSessionService } from '@/modules/guest-session/service/guest-session.service';
import { EmailProducer } from '@/modules/jobs/producers/email.producer';
import { RoleService } from '@/modules/role/service/role.service';
import { UserRoleService } from '@/modules/user/service/user-role.service';
import { OTP_TIME_SECONDS } from '@/modules/verification-code/constants/verification-code.constants';
import { VerificationCodeService } from '@/modules/verification-code/service/verification-code.service';
import { hashToken, tokenHash } from '@/utils/hashToken.util';
import { randomKey } from '@/utils/randomKey.util';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleCode, UserSession } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const RESEND_BLOCK_WINDOW_IN_MS = 5 * 60 * 60 * 1000;
const RESEND_MAX_ATTEMPTS_PER_DAY = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly emailOutboxService: EmailOutboxService,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly userSessionService: UserSessionService,
    private readonly revokedTokenService: RevokedTokenService,
    private readonly userDeviceService: UserDeviceService,
    private readonly emailProducer: EmailProducer,
    private readonly userRoleService: UserRoleService,
    private readonly roleService: RoleService,
    private readonly guestSessionService: GuestSessionService,
  ) { }

  getMe(id: number) {
    return this.authRepository.findUserById(id);
  }

  getActiveDeviceSessions(userId: number) {
    return this.userSessionService.findActiveSessionsByUserId(userId);
  }

  // Cho phép domain khác (Cart, Wishlist) lấy user theo id qua service thay vì repository
  findUserById(id: number) {
    return this.authRepository.findUserById(id);
  }

  async register(
    body: RegisterRequestDto,
    userAgent: string,
    ip: string,
    guestSessionId?: string,
  ) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException(RegisterMessage.PASSWORD_CONFIRM_MISMATCH);
    }

    const existsEmail = await this.authRepository.existsEmail(body.email);
    if (existsEmail) {
      throw new ConflictException(RegisterMessage.EMAIL_EXISTS);
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await this.authRepository.createUser({
      email: body.email,
      password: passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
    });

    const signature = this.signTokenPair({
      sub: user.id.toString(),
      isEmailVerified: user.isEmailVerified,
      roles: [RoleCode.CUSTOMER],
    });

    const role = await this.roleService.findRoleByName('customer');

    if (!role)
      throw new BadRequestException(RegisterMessage.ACCOUNT_CREATE_FAILED);
    await Promise.all([
      this.userRoleService.createUserRole({
        userId: user.id,
        roleId: role?.id,
      }),
      this.loginAttemptService.createLoginAttempt({
        userId: user.id,
        ip,
        userAgent,
        success: true,
      }),
      this.userSessionService.createSession({
        userId: user.id,
        ip,
        refreshToken: signature.refreshToken,
        userAgent,
      }),
    ]);

    const expiresAt = this.signVerifyCode();

    const verificationBundle =
      await this.verificationCodeService.createRegisterVerification({
        email: user.email,
        userId: user.id,
        expiresAt,
      });
    // Add queue
    await this.emailProducer.enqueueOutboxEmail(
      verificationBundle.outbox.id,
      verificationBundle.verification.id,
    );

    if (guestSessionId) {
      await this.guestSessionService.convertGuestSessionToUser(
        guestSessionId,
        user.id,
      );
    }

    return { user, ...signature };
  }

  signTokenPair(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomKey();
    return {
      accessToken,
      refreshToken,
    };
  }

  signVerifyCode() {
    const expiresAt = new Date(Date.now() + OTP_TIME_SECONDS * 1000);
    return expiresAt;
  }

  async verifyEmail(params: VerifyEmailRequestDto) {
    const { token } = params;
    const codeHash = hashToken(token);
    const verification =
      await this.verificationCodeService.findActiveRegisterByCodeHash(codeHash);

    if (!verification) {
      throw new BadRequestException(
        RegisterMessage.INVALID_OR_EXPIRED_VERIFY_TOKEN,
      );
    }

    const now = new Date();
    if (verification.expiresAt.getTime() < now.getTime()) {
      // Đánh dẫu đã dùng
      await this.verificationCodeService.markUsedById(verification.id, now);
      throw new BadRequestException(
        RegisterMessage.INVALID_OR_EXPIRED_VERIFY_TOKEN,
      );
    }
    // Verify thành công cũng đánh dấu
    await this.verificationCodeService.markUsedById(verification.id, now);

    // Nếu không có userId thì có thể do người dùng bị xoá
    if (!verification.userId) {
      throw new BadRequestException(
        RegisterMessage.INVALID_OR_EXPIRED_VERIFY_TOKEN,
      );
    }

    // Đánh dấu tài khoản đã verify
    await this.authRepository.markEmailVerified(verification.userId);
    return { success: true };
  }

  async resendEmail(params: ResendVerifyEmailRequestDto, url: string) {
    const { email } = params;

    const user = await this.authRepository.findUserByEmail(email);
    if (!user || user.isEmailVerified) {
      return { success: true };
    }

    //  thời gian trong ngày
    const since = new Date(Date.now() - ONE_DAY_IN_MS);
    // Check số lượng email đã gửi trong khoảng thời gian 1 ngày
    const [countRecentOtp, latestRecentOtp] = await Promise.all([
      this.emailOutboxService.countOtpRegisterByEmailSince(email, since),
      this.emailOutboxService.findLatestOtpRegisterByEmailSince(email, since),
    ]);

    // Nếu số lượng đã gửi lớn >= 5 và lần gửi otp gần nhất nhiều + khoảng cách lần cuối cùng gửi quá gần 5 giờ thì chặn
    if (
      countRecentOtp >= RESEND_MAX_ATTEMPTS_PER_DAY &&
      latestRecentOtp &&
      latestRecentOtp.createdAt.getTime() + RESEND_BLOCK_WINDOW_IN_MS >
      Date.now()
    ) {
      // Chặn resend-email
      throw new HttpException(
        RegisterMessage.RESEND_VERIFY_EMAIL_QUOTA_EXCEEDED,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const now = new Date();
    await Promise.all([
      this.verificationCodeService.markAllRegisterUnusedByEmail(email, now), // ??
      this.emailOutboxService.cancelOtpRegisterInProgressByEmail(email),
    ]);

    // Đăng kí tạo mới
    const verificationBundle =
      await this.verificationCodeService.createRegisterVerification({
        email: user.email,
        userId: user.id,
        expiresAt: this.signVerifyCode(),
      });

    // thêm ngăn xếp
    await this.emailProducer.enqueueOutboxEmail(
      verificationBundle.outbox.id,
      verificationBundle.verification.id,
    );

    return { success: true };
  }

  async login(body: LoginRequestDto, userAgent: string, ip: string) {
    console.log('Login successful for user');

    const user = await this.authRepository.findAuthByEmailPassword(body.email);
    if (!user) {
      await this.loginAttemptService.createLoginAttempt({
        ip,
        userAgent,
        success: false,
        failureReason: LoginMessage.LOGIN_FAILED,
      });
      throw new UnauthorizedException(LoginMessage.LOGIN_FAILED);
    }
    const isPassword = await bcrypt.compare(body.password, user.password);
    if (!isPassword) {
      await this.loginAttemptService.createLoginAttempt({
        userId: user.id,
        ip,
        userAgent,
        success: false,
        failureReason: LoginMessage.LOGIN_FAILED,
      });
      throw new UnauthorizedException(LoginMessage.LOGIN_FAILED);
    }

    const { password, ...safeUser } = user;

    const roles = await this.userRoleService.getRolesByUserId(user.id);

    const signature = this.signTokenPair({
      sub: safeUser.id.toString(),
      isEmailVerified: safeUser.isEmailVerified,
      roles,
    });

    const device = await this.userDeviceService.upsertDeviceOnLogin({
      userId: safeUser.id,
      deviceFingerprint: body?.deviceFingerprint ?? v4(),
      userAgent,
    });

    await Promise.all([
      this.loginAttemptService.createLoginAttempt({
        userId: user.id,
        ip,
        userAgent,
        success: true,
      }),
      this.userSessionService.createSession({
        userId: safeUser.id,
        ip,
        refreshToken: signature.refreshToken,
        userAgent,
        deviceId: device.id,
      }),
    ]);

    console.log('Login successful for user:', safeUser.email, 'with roles:');
    return { user: safeUser, ...signature };
  }

  async refreshToken(userAgent: string, session: UserSession) {
    if (!session) throw new UnauthorizedException();

    const user = await this.authRepository.findUserById(session.userId);
    if (!user) throw new UnauthorizedException();
    const roles = await this.userRoleService.getRolesByUserId(user.id);
    const signature = this.signTokenPair({
      sub: user.id.toString(),
      isEmailVerified: user.isEmailVerified,
      roles,
    });

    await this.userSessionService.rotateSession({
      sessionId: session.id,
      refreshToken: signature.refreshToken,
      userAgent,
    });

    return { user, ...signature };
  }

  async logout(body: { refreshToken?: string; accessToken?: string }) {
    const { refreshToken, accessToken } = body;
    if (!refreshToken || !accessToken) {
      throw new UnauthorizedException();
    }

    let payload: { exp?: number } | null = null;
    try {
      payload = await this.jwtService.verifyAsync(accessToken, {
        ignoreExpiration: true,
      });
    } catch {
      throw new UnauthorizedException();
    }

    if (!payload?.exp || typeof payload.exp !== 'number') {
      throw new UnauthorizedException();
    }

    const expiresAt = new Date(payload.exp * 1000);
    const accessTokenHash = tokenHash(accessToken);

    await Promise.all([
      this.revokedTokenService.revokeToken(accessTokenHash, expiresAt),
      this.userSessionService.revokeSessionByRefreshToken(refreshToken),
    ]);

    return { success: true };
  }

  async changePassword(userId: number, body: ChangePasswordRequestDto) {
    if (body.newPassword !== body.confirmNewPassword) {
      throw new BadRequestException(
        ChangePasswordMessage.NEW_PASSWORD_CONFIRM_MISMATCH,
      );
    }

    const user = await this.authRepository.findUserPasswordById(userId);
    if (!user) throw new UnauthorizedException();

    const isPassword = await bcrypt.compare(body.oldPassword, user.password);
    if (!isPassword) {
      throw new BadRequestException(
        ChangePasswordMessage.OLD_PASSWORD_INCORRECT,
      );
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await this.authRepository.updatePassword(userId, passwordHash);
    return { success: true };
  }

  async forgotPassword(body: ForgotPasswordRequestDto) {
    const user = await this.authRepository.findUserByEmail(body.email);
    if (!user) {
      return { success: true };
    }

    const verificationBundle =
      await this.verificationCodeService.createForgotPasswordVerification({
        email: user.email,
        userId: user.id,
        expiresAt: this.signVerifyCode(),
      });

    await this.emailProducer.enqueueOutboxEmail(
      verificationBundle.outbox.id,
      verificationBundle.verification.id,
    );

    return { success: true };
  }

  async validateResetPasswordToken(body: ResetPasswordValidateRequestDto) {
    const codeHash = hashToken(body.token);
    const verification =
      await this.verificationCodeService.findActiveForgotByCodeHash(codeHash);

    if (!verification) {
      return { valid: false };
    }

    const now = new Date();
    if (verification.expiresAt.getTime() < now.getTime()) {
      await this.verificationCodeService.markUsedById(verification.id, now);
      return { valid: false };
    }

    return { valid: true };
  }

  async resetPassword(body: ResetPasswordRequestDto) {
    if (body.password !== body.passwordConfirmation) {
      throw new BadRequestException(
        ForgotPasswordMessage.RESET_PASSWORD_CONFIRM_MISMATCH,
      );
    }

    const codeHash = hashToken(body.token);
    const verification =
      await this.verificationCodeService.findActiveForgotByCodeHash(
        codeHash,
        body.email,
      );

    if (!verification) {
      throw new BadRequestException(
        ForgotPasswordMessage.INVALID_OR_EXPIRED_RESET_TOKEN,
      );
    }

    const now = new Date();
    if (verification.expiresAt.getTime() < now.getTime()) {
      await this.verificationCodeService.markUsedById(verification.id, now);
      throw new BadRequestException(
        ForgotPasswordMessage.INVALID_OR_EXPIRED_RESET_TOKEN,
      );
    }

    const user = await this.authRepository.findUserPasswordByEmail(body.email);
    if (!user) {
      throw new BadRequestException(
        ForgotPasswordMessage.INVALID_OR_EXPIRED_RESET_TOKEN,
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    await this.authRepository.updatePassword(user.id, passwordHash);
    await this.verificationCodeService.markUsedById(verification.id, now);

    return { success: true };
  }
}

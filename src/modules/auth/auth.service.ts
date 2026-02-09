import { LoginMessage, RegisterMessage } from '@/common/';
import { JwtPayload } from '@/common/dto/jwt.dto';
import { AuthRepository } from '@/modules/auth/auth.repository';
import {
    LoginRequestDto,
    RegisterRequestDto,
    ResendVerifyEmailRequestDto,
    VerifyEmailRequestDto
} from '@/modules/auth/dto/request';
import { EmailOutboxService } from '@/modules/email-outbox/email-outbox.service';
import { EmailProducer } from '@/modules/jobs/producers/email.producer';
import { LoginAttemptService } from '@/modules/login-attempt/login-attempt.service';
import { RevokedTokenService } from '@/modules/revoked-token/revoked-token.service';
import { UserDeviceService } from '@/modules/user-device/user-device.service';
import { UserSessionService } from '@/modules/user-session/user-session.service';
import { OTP_TIME_SECONDS } from '@/modules/verification-code/verification-code.constants';
import { VerificationCodeService } from '@/modules/verification-code/verification-code.service';
import { hashToken, tokenHash } from '@/utils/hashToken.utils';
import { randomKey } from '@/utils/randomKey.utils';
import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleCode, UserSession } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const RESEND_BLOCK_WINDOW_IN_MS = 5 * 60 * 60 * 1000;
const RESEND_MAX_ATTEMPTS_PER_DAY = 5;

@Injectable()
export class AuthService {
    constructor(private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService,
        private readonly verificationCodeService: VerificationCodeService,
        private readonly emailOutboxService: EmailOutboxService,
        private readonly loginAttemptService: LoginAttemptService,
        private readonly userSessionService: UserSessionService,
        private readonly revokedTokenService: RevokedTokenService,
        private readonly userDeviceService: UserDeviceService,
        private readonly emailProducer: EmailProducer
    ) {
    }

    getMe(id: bigint) {
        return this.authRepository.findUserById(id);
    }

    async register(body: RegisterRequestDto, userAgent: string, ip: string) {
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
            lastName: body.lastName
        });

        const signature = this.signTokenPair({
            sub: user.id.toString(),
            isEmailVerified: user.isEmailVerified,
            roles: [RoleCode.GUEST]
        });

        await Promise.all([
            this.loginAttemptService.createLoginAttempt({
                userId: user.id,
                ip,
                userAgent,
                success: true,
            }),
            this.userSessionService.createSession({
                userId: user.id,
                refreshToken: signature.refreshToken,
                userAgent,
            })
        ])

        const expiresAt = this.signVerifyCode();

        const verificationBundle = await this.verificationCodeService.createRegisterVerification({
            email: user.email,
            userId: user.id,
            expiresAt
        })
        await this.emailProducer.enqueueOutboxEmail(
            verificationBundle.outbox.id,
            verificationBundle.verification.id,
        );
        return { user, ...signature }
    }

    signTokenPair(payload: JwtPayload) {
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = randomKey();
        return {
            accessToken,
            refreshToken
        }
    }

    signVerifyCode() {
        const expiresAt = new Date(Date.now() + OTP_TIME_SECONDS * 1000);
        return expiresAt;
    }

    async verifyEmail(params: VerifyEmailRequestDto) {
        const { token } = params;
        const codeHash = await hashToken(token);
        const verification = await this.verificationCodeService.findActiveRegisterByCodeHash(codeHash);

        if (!verification) {
            throw new BadRequestException(RegisterMessage.INVALID_OR_EXPIRED_VERIFY_TOKEN);
        }

        const now = new Date();
        if (verification.expiresAt.getTime() < now.getTime()) {
            await this.verificationCodeService.markUsedById(verification.id, now);
            throw new BadRequestException(RegisterMessage.INVALID_OR_EXPIRED_VERIFY_TOKEN);
        }

        await this.verificationCodeService.markUsedById(verification.id, now);

        if (!verification.userId) {
            throw new BadRequestException(RegisterMessage.INVALID_OR_EXPIRED_VERIFY_TOKEN);
        }

        await this.authRepository.markEmailVerified(verification.userId);
        return { success: true };
    }

    async resendEmail(params: ResendVerifyEmailRequestDto) {
        const { email } = params;
        const user = await this.authRepository.findUserByEmail(email);
        if (!user || user.isEmailVerified) {
            return { success: true };
        }

        const since = new Date(Date.now() - ONE_DAY_IN_MS);
        const [countRecentOtp, latestRecentOtp] = await Promise.all([
            this.emailOutboxService.countOtpRegisterByEmailSince(email, since),
            this.emailOutboxService.findLatestOtpRegisterByEmailSince(email, since),
        ]);

        if (
            countRecentOtp >= RESEND_MAX_ATTEMPTS_PER_DAY &&
            latestRecentOtp &&
            latestRecentOtp.createdAt.getTime() + RESEND_BLOCK_WINDOW_IN_MS > Date.now()
        ) {
            throw new HttpException(
                RegisterMessage.RESEND_VERIFY_EMAIL_QUOTA_EXCEEDED,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        const now = new Date();
        await Promise.all([
            this.verificationCodeService.markAllRegisterUnusedByEmail(email, now),
            this.emailOutboxService.cancelOtpRegisterInProgressByEmail(email),
        ]);

        const verificationBundle = await this.verificationCodeService.createRegisterVerification({
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

    async login(body: LoginRequestDto, userAgent: string, ip: string) {
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
        const isPassword = await bcrypt.compare(body.password, user.password)
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
        const signature = this.signTokenPair({
            sub: safeUser.id.toString(),
            isEmailVerified: safeUser.isEmailVerified,
            roles: [RoleCode.GUEST]
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
                refreshToken: signature.refreshToken,
                userAgent,
                deviceId: device.id,
            })
        ])


        return { user: safeUser, ...signature }
    }

    async refreshToken(userAgent: string, session: UserSession) {
        if (!session) throw new UnauthorizedException();

        const user = await this.authRepository.findUserById(session.userId);
        if (!user) throw new UnauthorizedException();

        // TODO : Dùng GUEST là sai 
        const signature = this.signTokenPair({
            sub: user.id.toString(),
            isEmailVerified: user.isEmailVerified,
            roles: [RoleCode.GUEST]
        });

        await this.userSessionService.rotateSession({
            sessionId: session.id,
            refreshToken: signature.refreshToken,
            userAgent,
        });

        return { user, ...signature };
    }

    async logout(body: { refreshToken: string; accessToken: string }) {
        const { refreshToken, accessToken } = body

        let payload: { exp?: number } | null = null
        try {
            payload = await this.jwtService.verifyAsync(accessToken, { ignoreExpiration: true })
        } catch {
            throw new UnauthorizedException()
        }

        if (!payload?.exp || typeof payload.exp !== 'number') {
            throw new UnauthorizedException()
        }

        const expiresAt = new Date(payload.exp * 1000)
        const accessTokenHash = await tokenHash(accessToken)

        await Promise.all([
            this.revokedTokenService.revokeToken(accessTokenHash, expiresAt),
            this.userSessionService.revokeSessionByRefreshToken(refreshToken),
        ])

        return { success: true }
    }


    // forgotPassword(body: ForgotPasswordRequestDto) {
    //     // TODO: create reset token + send email
    //     return { success: true };
    // }

}

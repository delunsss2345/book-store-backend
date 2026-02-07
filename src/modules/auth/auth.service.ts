import { LoginMessage, RegisterMessage, VerifyCodePath } from '@/common/';
import { JwtPayload } from '@/common/dto/jwt.dto';
import { AuthRepository } from '@/modules/auth/auth.repository';
import {
    LoginBodyDTO,
    LogoutBodyDTO,
    RegisterBodyDTO
} from '@/modules/auth/dto/request';
import { LoginAttemptService } from '@/modules/login-attempt/login-attempt.service';
import { RevokedTokenService } from '@/modules/revoked-token/revoked-token.service';
import { UserDeviceService } from '@/modules/user-device/user-device.service';
import { UserSessionService } from '@/modules/user-session/user-session.service';
import { OTP_TIME_SECONDS } from '@/modules/verification-code/verification-code.constants';
import { VerificationCodeService } from '@/modules/verification-code/verification-code.service';
import { generateLinkWithType } from '@/utils/generateLink.utils';
import { tokenHash } from '@/utils/hashToken.utils';
import { randomKey } from '@/utils/randomKey.utils';
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleCode, UserSession } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 } from 'uuid';
@Injectable()
export class AuthService {
    constructor(private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService,
        private readonly verificationCodeService: VerificationCodeService,
        private readonly loginAttemptService: LoginAttemptService,
        private readonly userSessionService: UserSessionService,
        private readonly revokedTokenService: RevokedTokenService,
        private readonly userDeviceService: UserDeviceService
    ) {
    }

    getMe(id: bigint) {
        return this.authRepository.findUserById(id);
    }

    async register(body: RegisterBodyDTO, userAgent: string, ip: string) {
        if (body.password !== body.confirm_password) {
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

        const { link, token } = generateLinkWithType({ path: VerifyCodePath.VERIFY_EMAIL })
        const { codeHash, expiresAt } = await this.signVerifyCode(token)

        await this.verificationCodeService.createRegisterVerification({
            email: user.email,
            verifyUrl: link,
            fullName: user.lastName!.concat(" ", user.firstName!),
            userId: user.id,
            codeHash,
            token,
            expiresAt
        })

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

    async signVerifyCode(token: string) {
        const codeHash = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + OTP_TIME_SECONDS * 1000);
        return { codeHash, expiresAt };
    }

    async login(body: LoginBodyDTO, userAgent: string, ip: string) {
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

    async logout(body: LogoutBodyDTO) {
        const { accessToken, refreshToken } = body;
        let payload: { exp?: number } | null = null;
        try {
            payload = await this.jwtService.verifyAsync(accessToken, { ignoreExpiration: true });
        } catch {
            throw new UnauthorizedException();
        }

        if (!payload?.exp || typeof payload.exp !== 'number') {
            throw new UnauthorizedException();
        }

        const expiresAt = new Date(payload.exp * 1000);
        const accessTokenHash = await tokenHash(accessToken);
        await Promise.all([
            this.revokedTokenService.revokeToken(accessTokenHash, expiresAt),
            this.userSessionService.revokeSessionByRefreshToken(refreshToken)
        ])

        return { success: true };
    }

    // forgotPassword(body: ForgotPasswordBodyDTO) {
    //     // TODO: create reset token + send email
    //     return { success: true };
    // }

    // verifyEmail(body: VerifyEmailBodyDTO) {
    //     // TODO: verify token/code + mark email verified
    //     return { success: true };
    // }

    // resendVerifyEmail(body: ResendVerifyEmailBodyDTO) {
    //     // TODO: resend verify email
    //     return { success: true };
    // }
}

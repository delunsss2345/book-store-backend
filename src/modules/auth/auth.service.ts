import { LoginMessage, RegisterMessage, VerifyCodePath } from '@/common/';
import { JwtPayload } from '@/common/dto/jwt.dto';
import { AuthRepository } from '@/modules/auth/auth.repository';
import {
    LoginBodyDTO,
    RegisterBodyDTO
} from '@/modules/auth/dto/request';
import { LoginAttemptService } from '@/modules/login-attempt/login-attempt.service';
import { UserSessionService } from '@/modules/user-session/user-session.service';
import { OTP_TIME_SECONDS } from '@/modules/verification-code/verification-code.constants';
import { VerificationCodeService } from '@/modules/verification-code/verification-code.service';
import { generateLinkWithType } from '@/utils/generateLink.utils';
import { randomKey } from '@/utils/randomKey.utils';
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleCode } from '@prisma/client';
import bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
    constructor(private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService,
        private readonly verificationCodeService: VerificationCodeService,
        private readonly loginAttemptService: LoginAttemptService,
        private readonly userSessionService: UserSessionService
    ) {
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
        // TODO: issue access/refresh tokens
        // TODO: persist session/device with userAgent + ip

        const { password, ...safeUser } = user;
        const signature = this.signTokenPair({
            sub: safeUser.id.toString(),
            isEmailVerified: safeUser.isEmailVerified,
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
                userId: safeUser.id,
                refreshToken: signature.refreshToken,
                userAgent,
            })
        ])

        return { user: safeUser, ...signature }
    }

    // refreshToken(body: RefreshTokenBodyDTO, userAgent: string, ip: string) {
    //     // TODO: validate refresh token
    //     // TODO: rotate refresh token
    //     // TODO: check session/device by userAgent + ip if you need
    //     return { success: true };
    // }

    // logout(body: LogoutBodyDTO) {
    //     // TODO: revoke refresh token / session
    //     return { success: true };
    // }

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

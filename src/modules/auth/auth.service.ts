import {
    ForgotPasswordBodyDTO,
    LoginBodyDTO,
    LogoutBodyDTO,
    RefreshTokenBodyDTO,
    RegisterBodyDTO,
    ResendVerifyEmailBodyDTO,
    VerifyEmailBodyDTO,
} from '@/modules/auth/dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    register(body: RegisterBodyDTO) {
        return { success: true };
    }

    login(body: LoginBodyDTO, userAgent: string, ip: string) {
        // TODO: verify credentials
        // TODO: issue access/refresh tokens
        // TODO: persist session/device with userAgent + ip
        return { success: true };
    }

    refreshToken(body: RefreshTokenBodyDTO, userAgent: string, ip: string) {
        // TODO: validate refresh token
        // TODO: rotate refresh token
        // TODO: check session/device by userAgent + ip if you need
        return { success: true };
    }

    logout(body: LogoutBodyDTO) {
        // TODO: revoke refresh token / session
        return { success: true };
    }

    forgotPassword(body: ForgotPasswordBodyDTO) {
        // TODO: create reset token + send email
        return { success: true };
    }

    verifyEmail(body: VerifyEmailBodyDTO) {
        // TODO: verify token/code + mark email verified
        return { success: true };
    }

    resendVerifyEmail(body: ResendVerifyEmailBodyDTO) {
        // TODO: resend verify email
        return { success: true };
    }
}

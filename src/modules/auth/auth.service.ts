import { AuthRepository } from '@/modules/auth/auth.repository';
import {
    RegisterBodyDTO
} from '@/modules/auth/dto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
    constructor(private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService
    ) {
    }
    async register(body: RegisterBodyDTO) {
        const passwordHash = await bcrypt.hash(body.password, 10);

        const user = await this.authRepository.createUser({
            email: body.email,
            password: passwordHash,
            firstName: body.firstName,
            lastName: body.lastName
        });
        return { user }
    }

    // login(body: LoginBodyDTO, userAgent: string, ip: string) {
    //     // TODO: verify credentials
    //     // TODO: issue access/refresh tokens
    //     // TODO: persist session/device with userAgent + ip
    //     return { success: true };
    // }

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

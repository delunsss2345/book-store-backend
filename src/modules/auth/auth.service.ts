import { JwtPayload } from '@/common/dto/jwt.dto';
import { AuthRepository } from '@/modules/auth/auth.repository';
import {
    LoginBodyDTO,
    RegisterBodyDTO
} from '@/modules/auth/dto/request';
import { randomKey } from '@/utils/randomKey.utils';
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleCode } from '@prisma/client';
import bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
    constructor(private readonly authRepository: AuthRepository,
        private readonly jwtService: JwtService) {
    }
    async register(body: RegisterBodyDTO) {
        if (body.password !== body.confirm_password) {
            throw new BadRequestException('Mật khẩu xác nhận không khớp');
        }

        const existsEmail = await this.authRepository.existsEmail(body.email);
        if (existsEmail) {
            throw new ConflictException('Email đã tồn tại');
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

    async login(body: LoginBodyDTO, userAgent: string, ip: string) {
        console.log(userAgent);
        console.log(ip);
        const user = await this.authRepository.findAuthByEmailPassword(body.email);
        if (!user) {
            throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
        }
        const isPassword = await bcrypt.compare(body.password, user.password)
        if (!isPassword) {
            throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
        }
        // TODO: verify credentials
        // TODO: issue access/refresh tokens
        // TODO: persist session/device with userAgent + ip

        const { password, ...safeUser } = user;
        const signature = this.signTokenPair({
            sub: safeUser.id.toString(),
            isEmailVerified: safeUser.isEmailVerified,
            roles: [RoleCode.GUEST]
        });
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

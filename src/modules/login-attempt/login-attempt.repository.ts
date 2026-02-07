import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { CreateLoginAttemptRequestDto } from './dto/request/create-login-attempt.request.dto';

@Injectable()
export class LoginAttemptRepository {
    constructor(private readonly prisma: PrismaService) { }

    createLoginAttempt(params: CreateLoginAttemptRequestDto) {
        return this.prisma.loginAttempt.create({
            data: {
                userId: params.userId ?? null,
                ip: params.ip ?? null,
                userAgent: params.userAgent ?? null,
                success: params.success ?? null,
                failureReason: params.failureReason ?? null,
            },
        });
    }
}

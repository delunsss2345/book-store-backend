import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { EmailStatus } from '@prisma/client';
import { CreateOtpRegisterEmailRequestDto } from './dto/request/create-otp-register-email.request.dto';

@Injectable()
export class EmailOutboxRepository {
    constructor(private readonly prisma: PrismaService) { }

    createOtpRegisterEmail(params: CreateOtpRegisterEmailRequestDto) {
        const { toEmail, payload } = params;
        return this.prisma.emailOutbox.create({
            data: {
                toEmail,
                templateKey: 'OTP_REGISTER',
                payload : payload!,
                status: EmailStatus.PENDING,
            },
        });
    }
}

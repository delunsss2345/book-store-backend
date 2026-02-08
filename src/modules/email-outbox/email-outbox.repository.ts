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
                payload: payload!,
                status: EmailStatus.PENDING,
            },
        });
    }

    findByIdEmailPending(id: bigint) {
        return this.prisma.emailOutbox.findFirst({ where: { id, status: EmailStatus.PENDING } });
    }

    updateByIdEmailStatus(id: bigint, status: EmailStatus) {
        return this.prisma.emailOutbox.update({
            where: { id },
            data: { status },
        });
    }

}

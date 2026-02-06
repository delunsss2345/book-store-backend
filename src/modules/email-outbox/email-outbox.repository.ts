import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { EmailStatus, Prisma } from '@prisma/client';

@Injectable()
export class EmailOutboxRepository {
    constructor(private readonly prisma: PrismaService) { }

    createOtpRegisterEmail(params: {
        toEmail: string;
        payload: Prisma.JsonValue;
    }) {
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

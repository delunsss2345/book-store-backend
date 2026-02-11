import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { EmailStatus } from '@prisma/client';
import { CreateOtpRegisterEmailRequestDto } from './dto/request/create-otp-register-email.request.dto';

export const OTP_REGISTER_TEMPLATE_KEY = 'OTP_REGISTER';
export const OTP_FORGOT_PASSWORD_TEMPLATE_KEY = 'OTP_FORGOT_PASSWORD';

@Injectable()
export class EmailOutboxRepository {
    constructor(private readonly prisma: PrismaService) { }

    createOtpRegisterEmail(params: CreateOtpRegisterEmailRequestDto) {
        const { toEmail } = params;
        return this.prisma.emailOutbox.create({
            data: {
                toEmail,
                templateKey: OTP_REGISTER_TEMPLATE_KEY,
                status: EmailStatus.PENDING,
            },
        });
    }

    createOtpForgotPasswordEmail(params: CreateOtpRegisterEmailRequestDto) {
        const { toEmail } = params;
        return this.prisma.emailOutbox.create({
            data: {
                toEmail,
                templateKey: OTP_FORGOT_PASSWORD_TEMPLATE_KEY,
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

    countOtpRegisterByEmailSince(email: string, since: Date) {
        return this.prisma.emailOutbox.count({
            where: {
                toEmail: email,
                templateKey: OTP_REGISTER_TEMPLATE_KEY,
                createdAt: { gte: since },
            },
        });
    }

    findLatestOtpRegisterByEmailSince(email: string, since: Date) {
        return this.prisma.emailOutbox.findFirst({
            where: {
                toEmail: email,
                templateKey: OTP_REGISTER_TEMPLATE_KEY,
                createdAt: { gte: since },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    cancelOtpRegisterInProgressByEmail(email: string) {
        return this.prisma.emailOutbox.updateMany({
            where: {
                toEmail: email,
                templateKey: OTP_REGISTER_TEMPLATE_KEY,
                status: {
                    in: [EmailStatus.PENDING, EmailStatus.SENDING],
                },
            },
            data: {
                status: EmailStatus.CANCELLED,
            },
        });
    }

    findOtpOutbox(params: { templateKeys: string[]; status?: EmailStatus; limit: number }) {
        const { templateKeys, status, limit } = params;
        return this.prisma.emailOutbox.findMany({
            where: {
                templateKey: { in: templateKeys },
                ...(status ? { status } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}

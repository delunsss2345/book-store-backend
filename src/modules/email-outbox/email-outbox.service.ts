import { Injectable } from '@nestjs/common';
import { EmailStatus } from '@prisma/client';
import { CreateOtpRegisterEmailRequestDto } from './dto/request/create-otp-register-email.request.dto';
import { GetEmailOutboxQueryDto, OtpTypeFilter } from './dto/request/get-email-outbox.query.dto';
import {
    EmailOutboxRepository,
    OTP_FORGOT_PASSWORD_TEMPLATE_KEY,
    OTP_REGISTER_TEMPLATE_KEY,
} from './email-outbox.repository';

const OTP_TEMPLATE_KEY_BY_TYPE: Record<OtpTypeFilter, string> = {
    [OtpTypeFilter.REGISTER]: OTP_REGISTER_TEMPLATE_KEY,
    [OtpTypeFilter.FORGOT_PASSWORD]: OTP_FORGOT_PASSWORD_TEMPLATE_KEY,
};

@Injectable()
export class EmailOutboxService {
    constructor(private readonly emailOutboxRepository: EmailOutboxRepository) { }

    createOutboxRegisterEmail(params: CreateOtpRegisterEmailRequestDto) {
        return this.emailOutboxRepository.createOtpRegisterEmail(params);
    }

    createOutboxForgotPasswordEmail(params: CreateOtpRegisterEmailRequestDto) {
        return this.emailOutboxRepository.createOtpForgotPasswordEmail(params);
    }


    findByIdEmailBox(id: bigint) {
        return this.emailOutboxRepository.findByIdEmailPending(id)
    }


    markSending(id: bigint, status: EmailStatus) {
        return this.emailOutboxRepository.updateByIdEmailStatus(id, status)
    }

    countOtpRegisterByEmailSince(email: string, since: Date) {
        return this.emailOutboxRepository.countOtpRegisterByEmailSince(email, since);
    }

    findLatestOtpRegisterByEmailSince(email: string, since: Date) {
        return this.emailOutboxRepository.findLatestOtpRegisterByEmailSince(email, since);
    }

    cancelOtpRegisterInProgressByEmail(email: string) {
        return this.emailOutboxRepository.cancelOtpRegisterInProgressByEmail(email);
    }

    getOtpEmailOutbox(query: GetEmailOutboxQueryDto) {
        const templateKeys = query.otpType
            ? [OTP_TEMPLATE_KEY_BY_TYPE[query.otpType]]
            : [OTP_REGISTER_TEMPLATE_KEY, OTP_FORGOT_PASSWORD_TEMPLATE_KEY];

        return this.emailOutboxRepository.findOtpOutbox({
            templateKeys,
            status: query.status as EmailStatus | undefined,
            limit: query.limit ?? 50,
        });
    }
}

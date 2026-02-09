import { Injectable } from '@nestjs/common';
import { EmailStatus } from '@prisma/client';
import { CreateOtpRegisterEmailRequestDto } from './dto/request/create-otp-register-email.request.dto';
import { EmailOutboxRepository } from './email-outbox.repository';

@Injectable()
export class EmailOutboxService {
    constructor(private readonly emailOutboxRepository: EmailOutboxRepository) { }

    createOutboxRegisterEmail(params: CreateOtpRegisterEmailRequestDto) {
        return this.emailOutboxRepository.createOtpRegisterEmail(params);
    }


    findByIdEmailBox(id: bigint) {
        return this.emailOutboxRepository.findByIdEmailPending(id)
    }


    markSending(id: bigint, status: EmailStatus) {
        return this.emailOutboxRepository.updateByIdEmailStatus(id, status)
    }
}

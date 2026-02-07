import { Injectable } from '@nestjs/common';
import { EmailOutboxRepository } from './email-outbox.repository';
import { CreateOtpRegisterEmailRequestDto } from './dto/request/create-otp-register-email.request.dto';

@Injectable()
export class EmailOutboxService {
    constructor(private readonly emailOutboxRepository: EmailOutboxRepository) { }

    createOtpRegisterEmail(params: CreateOtpRegisterEmailRequestDto) {
        return this.emailOutboxRepository.createOtpRegisterEmail(params);
    }
}

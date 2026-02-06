import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EmailOutboxRepository } from './email-outbox.repository';

@Injectable()
export class EmailOutboxService {
    constructor(private readonly emailOutboxRepository: EmailOutboxRepository) { }

    createOtpRegisterEmail(params: { toEmail: string; payload: Prisma.JsonValue }) {
        return this.emailOutboxRepository.createOtpRegisterEmail(params);
    }
}

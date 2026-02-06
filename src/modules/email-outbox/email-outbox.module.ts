import { Module } from '@nestjs/common';
import { EmailOutboxRepository } from './email-outbox.repository';
import { EmailOutboxService } from './email-outbox.service';

@Module({
    providers: [EmailOutboxService, EmailOutboxRepository],
    exports: [EmailOutboxService],
})
export class EmailOutboxModule { }

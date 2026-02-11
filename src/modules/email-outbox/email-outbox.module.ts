import { Module } from '@nestjs/common';
import { EmailOutboxController } from './email-outbox.controller';
import { EmailOutboxRepository } from './email-outbox.repository';
import { EmailOutboxService } from './email-outbox.service';

@Module({
    controllers: [EmailOutboxController],
    providers: [EmailOutboxService, EmailOutboxRepository],
    exports: [EmailOutboxService],
})
export class EmailOutboxModule { }

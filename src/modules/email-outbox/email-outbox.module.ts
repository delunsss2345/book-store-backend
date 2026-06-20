import { Module } from '@nestjs/common';
import { EmailOutboxController } from './controller/email-outbox.controller';
import { EmailOutboxRepository } from './repository/email-outbox.repository';
import { EmailOutboxService } from './service/email-outbox.service';

@Module({
    controllers: [EmailOutboxController],
    providers: [EmailOutboxService, EmailOutboxRepository],
    exports: [EmailOutboxService],
})
export class EmailOutboxModule { }

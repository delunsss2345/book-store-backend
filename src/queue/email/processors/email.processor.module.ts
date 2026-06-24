import { EmailQueueProvider, RedisProvider } from '@/config/redis.config';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { VerificationCodeModule } from '@/modules/verification-code/verification-code.module';
import { MailService } from '@/queue/email/mail.service';
import { Module } from '@nestjs/common';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    RedisProvider,
    EmailQueueProvider,
    EmailOutboxModule,
    VerificationCodeModule,
  ],
  providers: [EmailProcessor, MailService],
})
export class EmailProcessorModule { }

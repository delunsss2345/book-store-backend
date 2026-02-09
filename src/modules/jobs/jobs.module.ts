import { EmailQueueProvider, RedisProvider } from '@/config/redis.config';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { EmailProcessor } from '@/modules/jobs/processors/email.processor';
import { EmailProducer } from '@/modules/jobs/producers/email.producer';
import { MailModule } from '@/modules/mail/mail.module';
import { VerificationCodeModule } from '@/modules/verification-code/verification-code.module';
import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Module({
  imports: [RedisProvider, EmailQueueProvider, EmailOutboxModule, MailModule, VerificationCodeModule],
  providers: [JobsService, EmailProducer, EmailProcessor],
  exports: [EmailProducer, EmailProcessor],
})
export class JobsModule { }

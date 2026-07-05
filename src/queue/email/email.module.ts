import { BullMqModule, EmailQueueProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailQueue } from './email.queue';
import { MailService } from './mail.service';

@Module({
  imports: [BullMqModule, EmailQueueProvider],
  controllers: [EmailController],
  providers: [EmailQueue, MailService],
  exports: [EmailQueue, MailService],
})
export class EmailModule {}

import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { VerificationRepository } from '@/modules/verification-code/verification-code.repository';
import { Module } from '@nestjs/common';
import { VerificationCodeService } from './verification-code.service';

@Module({
  imports: [EmailOutboxModule],
  providers: [VerificationCodeService, VerificationRepository],
})
export class VerificationCodeModule { }

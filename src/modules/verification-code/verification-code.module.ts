import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { VerificationRepository } from '@/modules/verification-code/repository/verification-code.repository';
import { Module } from '@nestjs/common';
import { VerificationCodeService } from './service/verification-code.service';

@Module({
  imports: [EmailOutboxModule],
  providers: [VerificationCodeService, VerificationRepository],
  exports: [VerificationCodeService, VerificationRepository]
})
export class VerificationCodeModule { }

import { EmailOutboxService } from '@/modules/email-outbox/email-outbox.service';
import { RegisterVerificationRequestDto } from '@/modules/verification-code/dto/request/register-verification.request.dto';
import { Injectable } from '@nestjs/common';
import { VerificationRepository } from './verification-code.repository';
@Injectable()
export class VerificationCodeService {
    constructor(
        private readonly verificationRepository: VerificationRepository,
        private readonly emailOutboxService: EmailOutboxService,
    ) { }

    async createRegisterVerification(params: RegisterVerificationRequestDto) {
        const { email, userId, expiresAt } = params;
        const { record } = await this.verificationRepository.createVerifyCationCode({
            userId,
            email,
            expiresAt
        });


        const outbox = await this.emailOutboxService.createOutboxRegisterEmail({
            toEmail: email
        });

        return { verification: record, outbox };
    }

    updateCodeHash(id: bigint, codeHash: string) {
        return this.verificationRepository.updateCodeHash(id, codeHash)
    }

    findActiveRegisterByCodeHash(codeHash: string) {
        return this.verificationRepository.findActiveRegisterByCodeHash(codeHash);
    }

    markUsedById(id: bigint, usedAt: Date) {
        return this.verificationRepository.markUsedById(id, usedAt);
    }

    markAllRegisterUnusedByEmail(email: string, usedAt: Date) {
        return this.verificationRepository.markAllRegisterUnusedByEmail(email, usedAt);
    }
}

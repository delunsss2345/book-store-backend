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


        await this.emailOutboxService.createOutboxRegisterEmail({
            toEmail: email
        });

        return { verification: record };
    }

    updateCodeHash(id: bigint, codeHash: string) {
        return this.verificationRepository.updateCodeHash(id, codeHash)
    }


    // Có vấn đề chưa nghĩa ra
    private resolveVerifyUrl(verifyUrl: string, token: string) {
        const placeholders = ['***', '{{token}}', ':token'];
        for (const placeholder of placeholders) {
            if (verifyUrl.includes(placeholder)) {
                return verifyUrl.replace(placeholder, encodeURIComponent(token));
            }
        }
        const separator = verifyUrl.includes('?') ? '&' : '?';
        return `${verifyUrl}${separator}token=${encodeURIComponent(token)}`;
    }
}

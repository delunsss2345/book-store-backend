import { EmailOutboxService } from '@/modules/email-outbox/service/email-outbox.service';
import { RegisterVerificationRequestDto } from '@/modules/verification-code/dto/request/register-verification.request.dto';
import { Injectable } from '@nestjs/common';
import { VerificationType } from '@prisma/client';
import { VerificationRepository } from '../repository/verification-code.repository';
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
            expiresAt,
            type: VerificationType.REGISTER,
        });


        const outbox = await this.emailOutboxService.createOutboxRegisterEmail({
            toEmail: email
        });

        return { verification: record, outbox };
    }

    async createForgotPasswordVerification(params: RegisterVerificationRequestDto) {
        const { email, userId, expiresAt } = params;
        const { record } = await this.verificationRepository.createVerifyCationCode({
            userId,
            email,
            expiresAt,
            type: VerificationType.FORGOT_PASSWORD,
        });

        const outbox = await this.emailOutboxService.createOutboxForgotPasswordEmail({
            toEmail: email,
        });

        return { verification: record, outbox };
    }
    updateExpiresAll(email: string) {
        return this.verificationRepository.markAllRegisterUnusedByEmail(email, new Date());
    }
    updateCodeHash(id: number, codeHash: string) {
        return this.verificationRepository.updateCodeHash(id, codeHash)
    }

    findActiveRegisterByCodeHash(codeHash: string) {
        return this.verificationRepository.findActiveRegisterByCodeHash(codeHash);
    }

    findActiveForgotByCodeHash(codeHash: string, email?: string) {
        return this.verificationRepository.findActiveForgotByCodeHash(codeHash, email);
    }

    markUsedById(id: number, usedAt: Date) {
        return this.verificationRepository.markUsedById(id, usedAt);
    }

    markAllRegisterUnusedByEmail(email: string, usedAt: Date) {
        return this.verificationRepository.markAllRegisterUnusedByEmail(email, usedAt);
    }
}

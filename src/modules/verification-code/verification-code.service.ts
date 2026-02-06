import { EmailOutboxService } from '@/modules/email-outbox/email-outbox.service';
import { RegisterVerificationDto } from '@/modules/verification-code/dto/register-verification.dto';
import { OTP_EXPIRES_MINUTES } from '@/modules/verification-code/verification-code.constants';
import { Injectable } from '@nestjs/common';
import { VerificationRepository } from './verification-code.repository';

@Injectable()
export class VerificationCodeService {
    constructor(
        private readonly verificationRepository: VerificationRepository,
        private readonly emailOutboxService: EmailOutboxService,
    ) { }

    async createRegisterVerification(params: RegisterVerificationDto) {
        const { email, fullName, verifyUrl, userId } = params;
        const { token, record } = await this.verificationRepository.createVerifyCationCode({
            userId,
            email,
        });

        const resolvedUrl = this.resolveVerifyUrl(verifyUrl, token);
        const payload = {
            full_name: fullName ?? '',
            verify_url: resolvedUrl,
            expires_minutes: OTP_EXPIRES_MINUTES,
        };

        await this.emailOutboxService.createOtpRegisterEmail({
            toEmail: email,
            payload,
        });

        return { token, verification: record };
    }

    private resolveVerifyUrl(verifyUrl: string, token: string) {
        const placeholders = ['***', '{token}', '{{token}}', ':token'];
        for (const placeholder of placeholders) {
            if (verifyUrl.includes(placeholder)) {
                return verifyUrl.replace(placeholder, encodeURIComponent(token));
            }
        }
        const separator = verifyUrl.includes('?') ? '&' : '?';
        return `${verifyUrl}${separator}token=${encodeURIComponent(token)}`;
    }
}

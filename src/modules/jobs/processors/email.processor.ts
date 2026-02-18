import { VerifyCodePath } from '@/common';
import {
    OTP_FORGOT_PASSWORD_TEMPLATE_KEY,
    OTP_REGISTER_TEMPLATE_KEY,
} from '@/modules/email-outbox/email-outbox.repository';
import { EmailOutboxService } from '@/modules/email-outbox/email-outbox.service';
import { MailService } from '@/modules/mail/mail.service';
import { OTP_EXPIRES_MINUTES } from '@/modules/verification-code/verification-code.constants';
import { VerificationCodeService } from '@/modules/verification-code/verification-code.service';
import { EMAIL_TEMPLATE, EMAIL_TEMPLATE_RESET_PASSWORD } from '@/template/email.template';
import { generateLinkWithType } from '@/utils/generateLink.util';
import { hashToken } from '@/utils/hashToken.util';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EmailStatus } from '@prisma/client';
import { Job } from 'bullmq';

@Processor('email')
export class EmailProcessor extends WorkerHost {
    constructor(
        private readonly emailOutbox: EmailOutboxService,
        private readonly mailService: MailService,
        private readonly verificationCodeService: VerificationCodeService
    ) {
        super();
    }
    async process(job: Job<{ outboxId: bigint; verificationCodeId: bigint }>) {
        const { outboxId, verificationCodeId } = job.data;
        const outBox = await this.emailOutbox.findByIdEmailBox((outboxId));
        try {

            if (!outBox) return;
            let path = VerifyCodePath.VERIFY_EMAIL;

            if (outBox.templateKey === OTP_FORGOT_PASSWORD_TEMPLATE_KEY) {
                path = VerifyCodePath.RESET_PASSWORD;
            } else if (outBox.templateKey !== OTP_REGISTER_TEMPLATE_KEY) {
                throw new Error('Unsupported email template key');
            }

            const { link, token } = generateLinkWithType({ path });
            const codeHash = hashToken(token);
            await this.verificationCodeService.updateCodeHash(verificationCodeId, codeHash)


            await this.emailOutbox.markSending(outBox.id, EmailStatus.SENDING);
            if (outBox.templateKey === OTP_REGISTER_TEMPLATE_KEY) {
                const html = this.applyTemplate(EMAIL_TEMPLATE, {
                    content: "Chào bạn, vui lòng xác thực tài khoản.",
                    link: link,
                    textLink: "Xác thực tài khoản",
                });
                await this.mailService.sendVerifyEmail(outBox.toEmail, html)
            } else if (outBox.templateKey === OTP_FORGOT_PASSWORD_TEMPLATE_KEY) {
                const html = this.applyTemplate(EMAIL_TEMPLATE_RESET_PASSWORD, {
                    content: 'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.',
                    resetCode: token,
                    expireMinutes: OTP_EXPIRES_MINUTES,
                });
                await this.mailService.sendForgotPasswordEmail(outBox.toEmail, html);
            }
            await this.emailOutbox.markSending(outBox.id, EmailStatus.SENT);
        }
        catch (er) {
            if (!outBox) return;
            await this.emailOutbox.markSending(outBox.id, EmailStatus.FAILED);
            throw er
        }
    }

    applyTemplate(template: string, values: Record<string, any>) {
        return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
            const v = values[key];
            return v === undefined || v === null ? "" : String(v);
        });
    }
}

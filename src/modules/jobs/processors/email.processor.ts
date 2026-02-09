import { VerifyCodePath } from '@/common';
import { EmailOutboxService } from '@/modules/email-outbox/email-outbox.service';
import { MailService } from '@/modules/mail/mail.service';
import { VerificationCodeService } from '@/modules/verification-code/verification-code.service';
import { EMAIL_TEMPLATE } from '@/template/email.template';
import { generateLinkWithType } from '@/utils/generateLink.utils';
import { hashToken } from '@/utils/hashToken.utils';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EmailStatus, VerificationType } from '@prisma/client';
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
    async process(job: Job<{ outboxId: bigint }>) {
        const { outboxId } = job.data;
        const outBox = await this.emailOutbox.findByIdEmailBox((outboxId));
        try {

            if (!outBox) return;
            const { link, token } = generateLinkWithType({ path: VerifyCodePath.VERIFY_EMAIL })
            const codeHash = await hashToken(token);
            await this.verificationCodeService.updateCodeHash(BigInt(outBox.id), codeHash)


            await this.emailOutbox.markSending(outBox.id, EmailStatus.SENDING);
            if (outBox.templateKey == `OTP_${VerificationType.REGISTER}`) {
                const html = this.applyTemplate(EMAIL_TEMPLATE, {
                    content: "Chào bạn, vui lòng xác thực tài khoản.",
                    link: link,
                    textLink: "Xác thực tài khoản",
                });
                await this.mailService.sendVerifyEmail(outBox.toEmail, html)
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
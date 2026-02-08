import { EmailOutboxService } from '@/modules/email-outbox/email-outbox.service';
import { MailService } from '@/modules/mail/mail.service';
import { EMAIL_TEMPLATE } from '@/template/email.template';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EmailStatus } from '@prisma/client';
import { Job } from 'bullmq';

@Processor('email')
export class EmailProcessor extends WorkerHost {
    constructor(
        private readonly emailOutbox: EmailOutboxService,
        private readonly mailService: MailService,
    ) {
        super();
    }
    async process(job: Job<{ outboxId: bigint }>) {
        const { outboxId } = job.data;
        const outBox = await this.emailOutbox.findByIdEmailBox((outboxId));
        try {

            if (!outBox) return;
            const payload = (outBox.payload);
            console.log(payload);
            await this.emailOutbox.markSending(outBox.id, EmailStatus.SENDING);
            await this.mailService.sendVerifyEmail(outBox.toEmail, EMAIL_TEMPLATE)

            await this.emailOutbox.markSending(outBox.id, EmailStatus.SENT);

        }
        catch (er) {
            if (!outBox) return;
            await this.emailOutbox.markSending(outBox.id, EmailStatus.FAILED);
            console.log(er);
        }
    }
}
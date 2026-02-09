import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailProducer {
    constructor(@InjectQueue('email') private readonly emailQueue: Queue) { }

    async enqueueOutboxEmail(outboxId: bigint, verificationCodeId: bigint) {
        await this.emailQueue.add(
            'send-email',
            { outboxId, verificationCodeId },
            {
                attempts: 3, // thất bại 3 lần tối đa
                backoff: { type: 'exponential', delay: 3000 }, // retry lâu hơn
                removeOnComplete: true, // Khi thành công xoá khỏi redis
                jobId: `email-${outboxId}`, // Lưu ở redis (ko cho dùng :)
            },
        );
    }
}
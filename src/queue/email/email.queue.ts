import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailQueue {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async enqueueOutboxEmail(outboxId: number, verificationCodeId: number) {
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

  async enqueueOrderEmail(outboxId: number) {
    await this.emailQueue.add(
      'send-order-email',
      { outboxId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        jobId: `order-email-${outboxId}`,
      },
    );
  }
}

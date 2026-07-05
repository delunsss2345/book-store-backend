import {
  EMAIL_JOB_ID_PREFIX,
  EMAIL_JOBS,
  EMAIL_QUEUE,
} from '@/common/constants/email-jobs.constant';
import {
  EnqueueOrderEmailPayloadDto,
  EnqueueOutboxEmailPayloadDto,
} from '@/queue/email/dto/payload';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailQueue {
  constructor(
    @InjectQueue(EMAIL_QUEUE.NAME) private readonly emailQueue: Queue,
  ) {}

  async enqueueOutboxEmail(payload: EnqueueOutboxEmailPayloadDto) {
    await this.emailQueue.add(EMAIL_JOBS.SEND_EMAIL, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      jobId: `${EMAIL_JOB_ID_PREFIX.OUTBOX}-${payload.outboxId}`,
    });
  }

  async enqueueOrderEmail(payload: EnqueueOrderEmailPayloadDto) {
    await this.emailQueue.add(EMAIL_JOBS.SEND_ORDER_EMAIL, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      jobId: `${EMAIL_JOB_ID_PREFIX.ORDER}-${payload.outboxId}`,
    });
  }
}

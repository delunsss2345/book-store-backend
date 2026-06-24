import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class CheckoutQueue {
  constructor(@InjectQueue('checkout') private readonly checkoutQueue: Queue) {}

  async enqueueCheckout(data: unknown, jobId?: string) {
    return this.checkoutQueue.add('checkout', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      ...(jobId ? { jobId } : {}),
    });
  }
}

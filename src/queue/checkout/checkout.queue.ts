import { ORDER_JOBS } from '@/common/constants/order-jobs.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class CheckoutQueue {
  constructor(@InjectQueue('order') private readonly orderQueue: Queue) {}

  async enqueueCheckout(data: unknown, jobId?: string) {
    return this.orderQueue.add(ORDER_JOBS.CHECKOUT, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: true,
      ...(jobId ? { jobId } : {}),
    });
  }
}

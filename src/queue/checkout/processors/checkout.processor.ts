import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Injectable()
@Processor('checkout')
export class CheckoutProcessor extends WorkerHost {
  private readonly logger = new Logger(CheckoutProcessor.name);

  async process(job: Job) {
    this.logger.debug(`Processing checkout job ${job.id}`);
  }
}

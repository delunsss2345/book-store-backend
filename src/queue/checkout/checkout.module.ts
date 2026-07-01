import { BullMqModule, OrderQueueProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { CheckoutQueue } from './checkout.queue';

@Module({
  imports: [BullMqModule, OrderQueueProvider],
  providers: [CheckoutQueue],
  exports: [CheckoutQueue],
})
export class CheckoutModule { }

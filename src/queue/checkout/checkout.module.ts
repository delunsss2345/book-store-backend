import { CheckoutQueueProvider, RedisProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { CheckoutQueue } from './checkout.queue';

@Module({
  imports: [RedisProvider, CheckoutQueueProvider],
  providers: [CheckoutQueue],
  exports: [CheckoutQueue],
})
export class CheckoutModule {}

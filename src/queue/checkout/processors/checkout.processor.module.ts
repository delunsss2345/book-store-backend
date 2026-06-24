import { CheckoutQueueProvider, RedisProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { CheckoutProcessor } from './checkout.processor';

@Module({
  imports: [RedisProvider, CheckoutQueueProvider],
  providers: [CheckoutProcessor],
})
export class CheckoutProcessorModule {}

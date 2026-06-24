import { CheckoutProcessorModule } from '@/queue/checkout/processors/checkout.processor.module';
import { EmailProcessorModule } from '@/queue/email/processors/email.processor.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [EmailProcessorModule, CheckoutProcessorModule],
})
export class WorkerModule {}

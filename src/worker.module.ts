import { DatabaseModule } from '@/database';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { TransactionModule } from '@/modules/transaction/transaction.module';
import { CheckoutProcessorModule } from '@/queue/checkout/processors/checkout.processor.module';
import { EmailProcessorModule } from '@/queue/email/processors/email.processor.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    EmailProcessorModule,
    CheckoutProcessorModule,
    TransactionModule,
    EmailOutboxModule,
  ],

})
export class WorkerModule { }

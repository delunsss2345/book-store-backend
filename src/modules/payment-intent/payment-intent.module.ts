import { Module } from '@nestjs/common';
import { PaymentIntentRepository } from './payment-intent.repository';
import { PaymentIntentService } from './payment-intent.service';

@Module({
  providers: [PaymentIntentService, PaymentIntentRepository],
  exports: [PaymentIntentService, PaymentIntentRepository],
})
export class PaymentIntentModule { }

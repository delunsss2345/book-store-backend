import { PaymentController } from '@/modules/payment/controller/payment.controller';
import { Module } from '@nestjs/common';
import { PaymentIntentRepository } from './repository/payment-intent.repository';
import { PaymentRepository } from './repository/payment.repository';
import { PaymentIntentService } from './service/payment-intent.service';
import { PaymentService } from './service/payment.service';
@Module({
    providers: [
        PaymentService,
        PaymentIntentService,
        PaymentRepository,
        PaymentIntentRepository,
        PaymentController,
    ],
    exports: [
        PaymentService,
        PaymentIntentService,
        PaymentRepository,
        PaymentIntentRepository,
    ],
    controllers: [PaymentController],
})
export class PaymentModule { };

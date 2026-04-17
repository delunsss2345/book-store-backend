import { PaymentController } from '@/modules/payment/payment.controller';
import { Module } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
@Module({
    providers: [PaymentService, PaymentRepository, PaymentController],
    exports: [PaymentService, PaymentRepository],
    controllers: [PaymentController],
})
export class PaymentModule { };
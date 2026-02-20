import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
@Module({
    providers: [PaymentService , PaymentRepository],
    exports: [PaymentService , PaymentRepository]
})
export class PaymentModule { };
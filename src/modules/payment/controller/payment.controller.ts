import { Public } from '@/common/security/decorators/public.decorator';
import { PaymentService } from '@/modules/payment/service/payment.service';
import { Controller, Get, Injectable, Param } from '@nestjs/common';
@Injectable()
@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }


    @Get("/:token/qr")
    @Public()
    async getPaymentQrCode(@Param('token') token: string) {
        return this.paymentService.getPaymentIntent(token);
    }
}
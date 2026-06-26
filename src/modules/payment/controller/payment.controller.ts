import { Public } from '@/common/security/decorators/public.decorator';
import { PaymentIntentResponseDto } from '@/modules/payment/dto/response/payment-intent.response.dto';
import { PaymentService } from '@/modules/payment/service/payment.service';
import { Controller, Get, Injectable, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Payments')
@Injectable()
@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }


    @Get("/:token/qr")
    @Public()
    @ApiOperation({ summary: 'Get payment QR code by token' })
    @ApiParam({ name: 'token', type: String, description: 'Payment intent token' })
    @ApiOkResponse({ type: PaymentIntentResponseDto })
    async getPaymentQrCode(@Param('token') token: string) {
        return this.paymentService.getPaymentIntent(token);
    }
}
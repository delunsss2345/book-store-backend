import { Payment } from '@/common/security/decorators/payment.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { PaymentGuard } from '@/common/security/guard/payment.guard';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { SePayHooksDto } from './dto/request/sepay-hooks.dto';

@Controller('hooks')
@UseGuards(PaymentGuard)
export class HooksController {
    constructor() { }

    @Post('sepay-payment')
    @HttpCode(HttpStatus.OK)
    @Public()
    @Payment()
    sePayPayment(@Body() body: SePayHooksDto) {
        return body;
    }
}


import { Payment } from '@/common/security/decorators/payment.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { PaymentGuard } from '@/common/security/guard/payment.guard';
import { SePayHooksDto } from '@/modules/hooks/dto/request/sepay-hooks.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { HooksService } from './hooks.service';

@Controller('hooks')
@UseGuards(PaymentGuard)
export class HooksController {
    constructor(private readonly hooksService: HooksService) { }

    @Post('sepay-payment')
    @HttpCode(HttpStatus.OK)
    @Public()
    @Payment()
    async sePayPayment(@Body() body: SePayHooksDto) {
        return this.hooksService.handleSepayWebhook(body);
    }
    @Get(':orderId/status')
    @Public()
    getOrderStatus(@Param('orderId') orderId: string) {
        return this.hooksService.getOrderStatus(orderId);
    }
}

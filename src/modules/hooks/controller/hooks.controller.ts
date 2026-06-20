import { Payment } from '@/common/security/decorators/payment.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { PaymentGuard } from '@/common/security/guard/payment.guard';
import { SePayHooksDto } from '@/modules/hooks/dto/request/sepay-hooks.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { HooksService } from '../service/hooks.service';

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

    @Get(':orderCode/status')
    @Public()
    getOrderStatus(@Param('orderCode') orderCode: string) {
        return this.hooksService.getOrderStatus(orderCode);
    }


}

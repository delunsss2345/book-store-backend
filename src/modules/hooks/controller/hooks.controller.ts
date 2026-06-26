import { Payment } from '@/common/security/decorators/payment.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { PaymentGuard } from '@/common/security/guard/payment.guard';
import { SePayHooksDto } from '@/modules/hooks/dto/request/sepay-hooks.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { HooksService } from '../service/hooks.service';

@ApiTags('Hooks')
@Controller('hooks')
@UseGuards(PaymentGuard)
export class HooksController {
    constructor(private readonly hooksService: HooksService) { }

    @Post('sepay-payment')
    @HttpCode(HttpStatus.OK)
    @Public()
    @Payment()
    @ApiOperation({ summary: 'Handle SePay payment webhook' })
    @ApiBody({ type: SePayHooksDto })
    @ApiOkResponse({ description: 'Webhook processed successfully', type: Object })
    async sePayPayment(@Body() body: SePayHooksDto) {
        return this.hooksService.handleSepayWebhook(body);
    }

    @Get(':orderCode/status')
    @Public()
    @ApiOperation({ summary: 'Get payment order status by order code' })
    @ApiParam({ name: 'orderCode', type: String, description: 'The order code to look up payment status for' })
    @ApiOkResponse({ description: 'Order status retrieved successfully', type: Object })
    getOrderStatus(@Param('orderCode') orderCode: string) {
        return this.hooksService.getOrderStatus(orderCode);
    }


}

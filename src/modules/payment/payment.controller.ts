import { Public } from '@/common/security/decorators/public.decorator';
import { PaymentService } from '@/modules/payment/payment.service';
import { Controller, Get, Injectable, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Readable } from 'stream';
@Injectable()
@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }


    @Get("/:token/qr")
    @Public()
    async getPaymentQrCode(@Res() res: Response, @Param('token') token: string) {
        const url = await this.paymentService.getImageUrl(token);
        if (!url) {
            throw new Error('Không tìm thấy thông tin thanh toán');
        }
        const response = await fetch(url);

        if (!response.ok || !response.body) {
            throw new Error('Failed to fetch QR image');
        }
        res.setHeader('Content-Type', 'image/png')
        const stream = Readable.fromWeb(response.body as any)
        stream.pipe(res)
    }
}
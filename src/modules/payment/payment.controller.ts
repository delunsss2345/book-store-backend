import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get, Injectable, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Readable } from 'stream';
@Injectable()
@Controller('payments')
export class PaymentController {
    constructor() { }


    @Get("/:token/qr")
    @Public()
    async getPaymentQrCode(@Res() res: Response, @Param('token') token: string) {
        const url = `https://qr.sepay.vn/img?bank=mbbank&acc=17979220797979&amount=1001`;

        const response = await fetch(url)
        res.setHeader('Content-Type', 'image/png')
        const stream = Readable.fromWeb(response.body as any)
        stream.pipe(res)
    }
}
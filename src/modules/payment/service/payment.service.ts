import { AppModule } from '@/app.module';
import { CreateUrlPaymentResponseDTO } from '@/modules/payment/dto/response/create-url-payment.dto';
import { PaymentIntentWithUrlResponseDto } from '@/modules/payment/dto/response/payment-intent-url.response.dto';
import { PaymentRepository } from '@/modules/payment/repository/payment.repository';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PaymentIntentService } from './payment-intent.service';
@Injectable()
export class PaymentService {

  private readonly logger = new Logger(PaymentService.name);
  private readonly bank = AppModule.CONFIGURATION.PAYMENT_CONFIG.BANK_ID;
  private readonly stk = AppModule.CONFIGURATION.PAYMENT_CONFIG.ACCOUNT_NO;
  private readonly template =
    AppModule.CONFIGURATION.PAYMENT_CONFIG.TEMPLATE_OR;

  constructor(
    private readonly paymentIntentService: PaymentIntentService,
    private readonly paymentRepository: PaymentRepository,
  ) { }

  createWebhookSepayTransaction(
    params: Parameters<PaymentRepository['createWebhookSepayTransaction']>[0],
  ) {
    return this.paymentRepository.createWebhookSepayTransaction(params);
  }

  // private generateContentOrder(): string {
  //   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //   let random = '';

  //   while (random.length < 8) {
  //     const byte = crypto.randomBytes(1)[0];
  //     random += chars[byte % chars.length];
  //   }

  //   return `taschen ${random}`;
  // }


  generateQrUrl(amount: number, orderCode: string): CreateUrlPaymentResponseDTO {
    const content = orderCode;
    const query = new URLSearchParams({
      bank: this.bank,
      acc: this.stk,
      template: this.template,
      amount: amount.toString(),
      des: content,
    });
    const url = `https://qr.sepay.vn/img?${query.toString()}`;
    const token = crypto.randomBytes(32).toString('hex');

    return {
      tokenUrl: token,
      paymentUrl: url,
      content,
    }
  }


  async getPaymentIntent(token: string): Promise<PaymentIntentWithUrlResponseDto | null> {
    return this.paymentIntentService.findByTokenUrl(token);
  }
}

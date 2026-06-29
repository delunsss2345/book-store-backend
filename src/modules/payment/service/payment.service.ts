import { CreateUrlPaymentResponseDTO } from '@/modules/payment/dto/response/create-url-payment.dto';
import { PaymentIntentWithUrlResponseDto } from '@/modules/payment/dto/response/payment-intent-url.response.dto';
import { PaymentRepository } from '@/modules/payment/repository/payment.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentIntentService } from './payment-intent.service';
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private bank: string;
  private stk: string;
  private template: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentIntentService: PaymentIntentService,
    private readonly paymentRepository: PaymentRepository,
  ) {
    this.bank = this.configService.get<string>('BANK_ID')!;
    this.stk = this.configService.get<string>('ACCOUNT_NO')!;
    this.template = this.configService.get<string>('TEMPLATE_OR')!;
  }

  createWebhookSepayTransaction(
    params: Parameters<PaymentRepository['createWebhookSepayTransaction']>[0],
  ) {
    return this.paymentRepository.createWebhookSepayTransaction(params);
  }

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

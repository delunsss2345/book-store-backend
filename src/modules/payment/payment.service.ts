import { AppModule } from '@/app.module';
import { PaymentMessage } from '@/common';
import { PaymentIntentService } from '@/modules/payment-intent';
import { PaymentIntentWithUrlResponseDto } from '@/modules/payment-intent/dto/response/payment-intent-url.response.dto';
import { CreatePaymentTransactionDto } from '@/modules/payment/dto/request/create-payment.dto';
import { CreateTransactionDto } from '@/modules/payment/dto/response/create-transaction.dto';
import { CreateUrlPaymentResponseDTO } from '@/modules/payment/dto/response/create-url-payment.dto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentGateway } from '@prisma/client';
import * as crypto from 'crypto';
@Injectable()
export class PaymentService {

  private readonly logger = new Logger(PaymentService.name);
  private readonly bank = AppModule.CONFIGURATION.PAYMENT_CONFIG.BANK_ID;
  private readonly stk = AppModule.CONFIGURATION.PAYMENT_CONFIG.ACCOUNT_NO;
  private readonly template =
    AppModule.CONFIGURATION.PAYMENT_CONFIG.TEMPLATE_OR;

  constructor(private readonly paymentIntentService: PaymentIntentService) { }

  private generateContentOrder(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let random = '';

    while (random.length < 8) {
      const byte = crypto.randomBytes(1)[0];
      random += chars[byte % chars.length];
    }

    return `taschen ${random}`;
  }

  createTransactionUrl(dto: CreatePaymentTransactionDto): CreateTransactionDto {
    const { orderId, gateway, amount } = dto;

    try {
      this.logger.log(
        PaymentMessage.CREATE_TRANSACTION_START(
          orderId.toString(),
          gateway.toString(),
        ),
      );
      let result = {} as CreateUrlPaymentResponseDTO;
      switch (gateway) {
        case PaymentGateway.SEPAY:
          result = this.generateQrUrl(amount);
          break;
        default:
          throw new BadRequestException(
            PaymentMessage.UNSUPPORTED_PAYMENT_GATEWAY,
          );
      }

      return {
        result,
        orderId: orderId.toString(),
        message: PaymentMessage.CREATE_TRANSACTION_SUCCESS,
      };
    } catch (error) {
      this.logger.error(`${PaymentMessage.CREATE_TRANSACTION_ERROR}: ${error}`);
      throw error;
    }
  }

  generateQrUrl(amount: number): CreateUrlPaymentResponseDTO {
    const content = this.generateContentOrder();
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
      token,
      url,
      content,
    }
  }


  async getPaymentIntent(token: string): Promise<PaymentIntentWithUrlResponseDto | null> {
    return this.paymentIntentService.findByTokenUrl(token);
  }
}

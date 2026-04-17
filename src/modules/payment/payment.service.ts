import { AppModule } from '@/app.module';
import { PaymentMessage } from '@/common';
import { PaymentIntentService } from '@/modules/payment-intent';
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

  createTransactionUrl(dto: CreatePaymentTransactionDto): CreateTransactionDto {
    const { orderId, gateway, amount } = dto;

    try {
      this.logger.log(
        `Đang tạo giao dịch cho đơn hàng: ${orderId} qua ${gateway}`,
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
        message: 'Khởi tạo giao dịch thành công',
      };
    } catch (error) {
      this.logger.error(`Lỗi tạo giao dịch: ${error}`);
      throw error;
    }
  }

  generateQrUrl(amount: number): CreateUrlPaymentResponseDTO {
    const url = `https://qr.sepay.vn/img?bank=${this.bank}&acc=${this.stk}&template=${this.template}&amount=${amount}`;
    const token = crypto.createHash('sha256').update(url).digest('hex');

    return {
      token,
      url
    }
  }


  async getImageUrl(token: string): Promise<string> {
    const res = await this.paymentIntentService.findByTokenUrl(token);
    if (!res) {
      throw new BadRequestException('Token không hợp lệ');
    }
    const url = `https://qr.sepay.vn/img?bank=${this.bank}&acc=${this.stk}&template=${this.template}&amount=${res.totalAmount}`;
    return url;
  }
}

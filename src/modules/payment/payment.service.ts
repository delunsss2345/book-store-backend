import { PaymentMessage } from '@/common';
import { AppModule } from '@/app.module';
import { CreatePaymentTransactionDto } from '@/modules/payment/dto/request/create-payment.dto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentGateway } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly bank = AppModule.CONFIGURATION.PAYMENT_CONFIG.BANK_ID;
  private readonly stk = AppModule.CONFIGURATION.PAYMENT_CONFIG.ACCOUNT_NO;
  private readonly template =
    AppModule.CONFIGURATION.PAYMENT_CONFIG.TEMPLATE_OR;

  constructor() {}

  /**
   * Khởi tạo giao dịch thanh toán
   */
  createTransactionUrl(dto: CreatePaymentTransactionDto) {
    const { orderId, gateway, amount } = dto;

    try {
      this.logger.log(
        `Đang tạo giao dịch cho đơn hàng: ${orderId} qua ${gateway}`,
      );
      let paymentUrl = '';
      switch (gateway) {
        case PaymentGateway.SEPAY:
          paymentUrl = this.generateQrUrl(amount);
          break;
        default:
          throw new BadRequestException(
            PaymentMessage.UNSUPPORTED_PAYMENT_GATEWAY,
          );
      }

      return {
        paymentUrl,
        orderId: orderId.toString(),
        message: 'Khởi tạo giao dịch thành công',
      };
    } catch (error) {
      this.logger.error(`Lỗi tạo giao dịch: ${error.message}`);
      throw error;
    }
  }

  generateQrUrl(amount: number): string {
    return `https://qr.sepay.vn/img?bank=${this.bank}&acc=${this.stk}&template=${this.template}&amount=${amount}`;
  }
}

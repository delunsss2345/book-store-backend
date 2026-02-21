import { CreatePaymentTransactionDto } from '@/modules/payment/dto/request/create-payment.dto';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentGateway } from '@prisma/client';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(

    ) { }

    /**
     * Khởi tạo giao dịch thanh toán
     */

    createTransaction(dto: CreatePaymentTransactionDto) {
        const { orderId, gateway, amount } = dto;

        try {
            this.logger.log(`Đang tạo giao dịch cho đơn hàng: ${orderId} qua ${gateway}`);

            // 1. Kiểm tra đơn hàng tồn tại (Logic nghiệp vụ của bạn)
            // const order = await this.orderService.findOne(orderId);

            // 2. Tùy biến logic theo từng Gateway
            let paymentUrl = '';
            switch (gateway) {
                // case PaymentGateway.VNPAY:
                //     paymentUrl = this.generateVnPayUrl(orderId, amount);
                //     break;
                // case PaymentGateway.MOMO:
                //     paymentUrl = this.generateMoMoUrl(orderId, amount);
                //     break;
                case PaymentGateway.SEPAY:
                    paymentUrl = this.generateQrUrl(orderId, amount);
                    break;
                default:
                    throw new BadRequestException('Cổng thanh toán không hỗ trợ');
            }

            // 3. Lưu log giao dịch vào DB
            // await this.transactionRepo.save({ orderId, gateway, amount, status: 'PENDING' });

            return {
                paymentUrl,
                orderId: orderId.toString(), // Convert BigInt sang String để trả về Client
                message: 'Khởi tạo giao dịch thành công',
            };
        } catch (error) {
            this.logger.error(`Lỗi tạo giao dịch: ${error.message}`);
            throw error;
        }
    }

    generateVnPayUrl(orderId: bigint, amount: number) {

    }

    generateMoMoUrl(orderId: bigint, amount: number) {
    }

    generateQrUrl(orderId: bigint, amount: number): string {
        const bankId = 'MBBank';
        const accountNo = '17979220797979';
        const template = 'compact';

        return `https://qr.sepay.vn/img?bank=${bankId}&acc=${accountNo}&template=${template}&amount=${amount}`;
    }
}
import { PrismaService } from "@/database";
import { CreatePaymentTransactionDto } from "@/modules/payment/dto/request/create-payment.dto";
import { Injectable } from "@nestjs/common";
import { CurrencyCode, PaymentGateway, PaymentStatus } from "@prisma/client";

type CreateWebhookSepayTransactionParams = {
    amount: number;
    orderId?: number | null;
    userId?: number | null;
    status: PaymentStatus;
};

@Injectable()
export class PaymentRepository {
    constructor(private readonly prisma: PrismaService) {
    }

    createPaymentTransaction(userId: number, payment: CreatePaymentTransactionDto) {
        return this.prisma.paymentTransaction.create({
            data: {
                userId,
                ...payment
            }
        })
    }

    createPaymentTransactionGuestId(payment: CreatePaymentTransactionDto) {
        return this.prisma.paymentTransaction.create({
            data: {
                ...payment
            }
        })
    }

    createWebhookSepayTransaction(params: CreateWebhookSepayTransactionParams) {
        return this.prisma.paymentTransaction.create({
            data: {
                orderId: params.orderId,
                userId: params.userId ?? null,
                gateway: PaymentGateway.SEPAY,
                status: params.status,
                amount: params.amount,
                currencyCode: CurrencyCode.VND,
            },
        })
    }


}

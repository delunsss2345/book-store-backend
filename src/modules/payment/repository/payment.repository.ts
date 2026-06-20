import { PrismaService } from "@/database";
import { CreatePaymentTransactionDto } from "@/modules/payment/dto/request/create-payment.dto";
import { Injectable } from "@nestjs/common";
import { PaymentGateway, PaymentStatus, Prisma } from "@prisma/client";

type CreateWebhookSepayTransactionParams = {
    amount: number;
    orderId?: number | null;
    userId?: number | null;
    providerEventId: string;
    referenceNumber?: string | null;
    requestId?: string | null;
    idempotencyKey?: string | null;
    status: PaymentStatus;
    payload: unknown;
    paymentUrl?: string | null;
    currencyCode?: string | null;
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
                orderId: params.orderId ?? null,
                userId: params.userId ?? null,
                gateway: PaymentGateway.SEPAY,
                status: params.status,
                amount: params.amount,
                currencyCode: params.currencyCode ?? 'VND',
                providerTxnId: params.providerEventId,
                referenceNumber: params.referenceNumber ?? null,
                requestId: params.requestId ?? null,
                idempotencyKey: params.idempotencyKey ?? params.providerEventId,
                paymentUrl: params.paymentUrl ?? null,
                requestPayload: params.payload as Prisma.InputJsonValue,
                responsePayload: params.payload as Prisma.InputJsonValue,
            } as any,
        })
    }


}

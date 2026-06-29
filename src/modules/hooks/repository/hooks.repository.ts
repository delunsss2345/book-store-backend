import { PrismaClientTransaction, PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import {
    JobStatus,
    OrderStatus,
    PaymentGateway,
    PaymentStatus,
    Prisma,
} from '@prisma/client';

export type FindWebhookInboxParams = {
    gateway?: PaymentGateway;
    idempotencyKey: number;
    status?: JobStatus;
};

const PaymentNotSuccessStatus = {
    PAYMENT_SHORTFALL: "PAYMENT_SHORTFALL",
    PAYMENT_OVERAGE: "PAYMENT_OVERAGE"
} as const;

type PaymentNotSuccess = typeof PaymentNotSuccessStatus[keyof typeof PaymentNotSuccessStatus];
@Injectable()
export class HooksRepository {
    constructor(private readonly prisma: PrismaService) { }

    saveSepayWebhook(idempotencyKey: number, payload: unknown) {
        const receivedAt = new Date();

        return this.prisma.webhookInbox.upsert({
            where: {
                gateway_idempotencyKey: {
                    gateway: PaymentGateway.SEPAY,
                    idempotencyKey,
                },
            },
            create: {
                gateway: PaymentGateway.SEPAY,
                idempotencyKey,
                receivedAt,
                payload: payload as Prisma.InputJsonValue,
                status: JobStatus.PENDING,
                attempts: 0,
            },
            update: {
                receivedAt,
                payload: payload as Prisma.InputJsonValue,
                status: JobStatus.PENDING,
            },
        });
    }

    findWebhookByIdempotencyKey(idempotencyKey: number, gateway: PaymentGateway = PaymentGateway.SEPAY) {
        return this.prisma.webhookInbox.findUnique({
            where: {
                gateway_idempotencyKey: {
                    gateway,
                    idempotencyKey,
                },
            },
        });
    }

    findWebhooksByCriteria(params: FindWebhookInboxParams) {
        return this.prisma.webhookInbox.findMany({
            where: {
                gateway: params.gateway,
                idempotencyKey: params.idempotencyKey,
                status: params.status,
            },
            orderBy: { receivedAt: 'desc' },
        });
    }

    updateWebhookStatus(
        webhookId: number,
        status: JobStatus,
        attempts: number,
        lastError?: string,
        tx?: PrismaClientTransaction,
    ) {
        const db = tx ?? this.prisma;
        return db.webhookInbox.update({
            where: { id: webhookId },
            data: {
                status,
                attempts,
                processedAt: new Date(),
                lastError: lastError ?? null,
            },
            select: {
                id: true,
                status: true,
                attempts: true,
                processedAt: true,
                lastError: true,
            },
        });
    }

    async findOrderByNormalizedOrderCode(normalizedOrderCode: string) {
        const orders = await this.prisma.order.findMany({
            select: {
                id: true,
                orderCode: true,
                status: true,
                paymentStatus: true,
                updatedAt: true,
                subtotal: true,
                userId: true,
                guestSessionId: true,
                totalAmount: true
            },
        });

        return (
            orders.find(
                (order) =>
                    order.orderCode
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '') === normalizedOrderCode,
            ) ?? null
        );
    }

    // Đảm bảo nhất quán 
    markOrderAndPaymentSuccess(
        orderId: number,
        idempotencyKey: number,
        payload: unknown,
        tx?: PrismaClientTransaction,
    ) {
        const updateOrderAndPayment = async (
            db: PrismaClientTransaction,
        ) => {
            const order = await db.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.PAID,
                    paymentStatus: PaymentStatus.SUCCESS,
                },
                select: {
                    id: true,
                    orderCode: true,
                    status: true,
                    paymentStatus: true,
                    updatedAt: true,
                },
            });

            await db.paymentTransaction.updateMany({
                where: { orderId },
                data: {
                    status: PaymentStatus.SUCCESS,
                    providerTxnId: idempotencyKey.toString(),
                    responsePayload: payload as Prisma.InputJsonValue,
                },
            });

            return order;
        };

        if (tx) {
            return updateOrderAndPayment(tx);
        }

        return this.prisma.$transaction(async (prismaTx) => {
            return updateOrderAndPayment(prismaTx);
        });
    }
    // Đảm bảo nhất quán 
    markPaymentNotSuccess(orderId: number, idempotencyKey: number, payload: unknown, status: PaymentNotSuccess) {
        return this.prisma.$transaction(async (tx) => {
            await tx.paymentTransaction.updateMany({
                where: { orderId },
                data: {
                    status,
                    providerTxnId: idempotencyKey.toString(),
                    responsePayload: payload as Prisma.InputJsonValue,
                },
            });
        });
    }


    findOrderStatusById(orderId: number) {
        return this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderCode: true,
                status: true,
                paymentStatus: true,
                updatedAt: true,
            },
        });
    }
    findOrderStatusByOrderCode(orderCode: string) {
        return this.prisma.order.findUnique({
            where: { orderCode },
            select: {
                id: true,
                orderCode: true,
                status: true,
                paymentStatus: true,
                updatedAt: true,
            },
        });
    }
}

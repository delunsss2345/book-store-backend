import { PrismaService } from '@/database';
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
    providerEventId?: string;
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

    saveSepayWebhook(providerEventId: string, payload: unknown) {
        const receivedAt = new Date();

        return this.prisma.webhookInbox.upsert({
            where: {
                gateway_providerEventId: {
                    gateway: PaymentGateway.SEPAY,
                    providerEventId,
                },
            },
            create: {
                gateway: PaymentGateway.SEPAY,
                providerEventId,
                receivedAt,
                payload: payload as Prisma.InputJsonValue,
                status: JobStatus.PENDING,
                attempts: 0,
            },
            update: {
                receivedAt,
                payload: payload as Prisma.InputJsonValue,
                status: JobStatus.PENDING,
                lastError: null,
            },
        });
    }

    findWebhookByProviderEventId(providerEventId: string, gateway: PaymentGateway = PaymentGateway.SEPAY) {
        return this.prisma.webhookInbox.findUnique({
            where: {
                gateway_providerEventId: {
                    gateway,
                    providerEventId,
                },
            },
        });
    }

    findWebhooksByCriteria(params: FindWebhookInboxParams) {
        return this.prisma.webhookInbox.findMany({
            where: {
                gateway: params.gateway,
                providerEventId: params.providerEventId,
                status: params.status,
            },
            orderBy: { receivedAt: 'desc' },
        });
    }

    updateWebhookStatus(webhookId: bigint, status: JobStatus, attempts: number, lastError?: string) {
        return this.prisma.webhookInbox.update({
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
    markOrderAndPaymentSuccess(orderId: bigint, providerEventId: string, payload: unknown) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
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
                },
            });

            await tx.paymentTransaction.updateMany({
                where: { orderId },
                data: {
                    status: PaymentStatus.SUCCESS,
                    providerTxnId: providerEventId,
                    responsePayload: payload as Prisma.InputJsonValue,
                },
            });

            return order;
        });
    }
    // Đảm bảo nhất quán 
    markPaymentNotSuccess(orderId: bigint, providerEventId: string, payload: unknown, status: PaymentNotSuccess) {
        return this.prisma.$transaction(async (tx) => {
            await tx.paymentTransaction.updateMany({
                where: { orderId },
                data: {
                    status,
                    providerTxnId: providerEventId,
                    responsePayload: payload as Prisma.InputJsonValue,
                },
            });
        });
    }


    findOrderStatusById(orderId: bigint) {
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

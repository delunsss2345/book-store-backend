import { SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { PrismaService } from '@/database';
import { generateOrderCode } from '@/utils/generateOrderCode.util';
import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';


export type OrderByUserRow = {
    quantity: number;
    bookVariantSnapshotId: bigint | null;
    bookVariantId: bigint | null;
    bookId: bigint | null;
};

export type OrderWithItemsRow = {
    id: bigint;
    items: {
        id: bigint;
        bookVariantSnapshotId: bigint | null;
        quantity: number;
        createdAt: Date;
    }[];
};


@Injectable()
export class OrderRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findOrderItemsByOrderId(orderIds: bigint[]): Promise<OrderWithItemsRow[]> {
        if (!orderIds.length) {
            return [];
        }

        return this.prisma.order.findMany({
            where: { id: { in: orderIds } },
            select: {
                id: true,
                items: {
                    select: {
                        id: true,
                        bookVariantSnapshotId: true,
                        quantity: true,
                        createdAt: true,
                    }
                }
            }
        })

    }

    async findOrderItemWWithParentVariantByOrderId(orderId: bigint) {
        return this.prisma.order.findFirst({
            where: { id: orderId },
            select: {
                id: true,
                items: {
                    select: {
                        id: true,
                        bookVariantSnapshot: {
                            select: {
                                bookVariant: {
                                    select: {
                                        id: true
                                    }
                                }
                            }
                        },
                        quantity: true,
                        createdAt: true,
                    }
                }
            }
        })

    }

    createOrdersByUserId(userId: bigint) {
        const orderCode = generateOrderCode();
        return this.prisma.order.create({
            data: {
                userId: userId,
                orderCode: orderCode,
                paymentStatus: PaymentStatus.PENDING,
                shippingFee: SHIPPING_FEE,
                expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000)
            }
        })
    }

    upsertOrdersByGuestId(guestId: string, idempotencyKey: string, totalAmount: number) {
        const orderCode = generateOrderCode();
        return this.prisma.order.upsert({
            where: { idempotencyKey },
            create: {
                idempotencyKey,
                totalAmount,
                guestSessionId: guestId,
                orderCode: orderCode,
                paymentStatus: PaymentStatus.PENDING,
                shippingFee: SHIPPING_FEE,
                expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000)
            },
            update: {}
        })
    }

    findOrderBySessionGuestId(guestId: string, page: number, limit: number, lang: string) {
        return this.prisma.order.findMany({
            take: limit,
            skip: (page - 1) * limit,
            where: { guestSessionId: guestId },
            orderBy: { createdAt: 'desc' }
        })
    }

    findOrderByUserId(userId: bigint, page: number, limit: number, lang: string) {
        return this.prisma.order.findMany({
            take: limit,
            skip: (page - 1) * limit,
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }
        })


    }

    findOrderIsExpire(orderSecondMinutes: number) {
        return this.prisma.order.findMany({
            where: {
                expiredAt: { lt: new Date(Date.now() + orderSecondMinutes * 1000) },
            },
            select: {
                items: {
                    select: {
                        quantity: true,
                        bookVariantSnapshot: {
                            select: {
                                bookVariantId: true
                            }
                        }
                    }
                }
            }
        });
    }

    clearOrder(variantMap: Map<string, number>, orderSecondMinutes: number) {
        return this.prisma.$transaction(async (tx) => {
            for (const [key, value] of variantMap) {
                await tx.bookVariant.updateMany({
                    where: { id: BigInt(key) },
                    data: {
                        stock: { increment: value },
                        reserved: { decrement: value }
                    }
                })
            }
            await tx.order.updateMany({
                where: {
                    expiredAt: new Date(Date.now() + orderSecondMinutes * 1000)
                },
                data: {
                    status: OrderStatus.CANCELLED
                }
            })
        })
    }

    updateOrderDone(variantMap: Map<string, number>, orderId: bigint) {
        return this.prisma.$transaction(async (tx) => {
            for (const [key, value] of variantMap) {
                await tx.bookVariant.updateMany({
                    where: { id: BigInt(key) },
                    data: {
                        stock: { decrement: value },
                        reserved: { decrement: value }
                    }
                })
            }
            await tx.order.update({
                where:
                    { id: orderId }
                ,
                data: {
                    status: OrderStatus.PAID
                }
            })
        })
    }
}


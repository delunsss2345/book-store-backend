import { SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { PrismaClientTransaction, PrismaService } from '@/database';
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

    async updateStatusByOrderId(orderId: bigint, status: OrderStatus) {
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status }
        })
    }

    async findOrderItemWWithParentVariantByOrderId(
        orderId: bigint,
        tx?: PrismaClientTransaction,
    ) {
        const db = tx ?? this.prisma;
        return db.order.findFirst({
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

    findOrderBySessionGuestId(guestId: string, page: number, limit: number) {
        return this.prisma.order.findMany({
            take: limit,
            skip: (page - 1) * limit,
            where: { guestSessionId: guestId },
            orderBy: { createdAt: 'desc' }
        })
    }

    findOrderByUserId(userId: bigint, page: number, limit: number) {
        return this.prisma.order.findMany({
            take: limit,
            skip: (page - 1) * limit,
            where: { userId: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                orderCode: true,
                totalAmount: true,
                userId: true,
                addressId: true,
                status: true,
                paymentStatus: true,
                subtotal: true,
                shippingFee: true,
                expiredAt: true,
                discountAmount: true,
                currencyCode: true,
                createdAt: true,
            }
        })

    }


    findOrderDetailByUserId(userId: bigint, page: number, limit: number) {
        return this.prisma.order.findMany({
            take: limit,
            skip: (page - 1) * limit,
            where: { userId: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                items: true
            }

        })

    }


    findOrderIsExpire(orderSecondMinutes: number) {
        return this.prisma.order.findMany({
            where: {
                expiredAt: { lt: new Date(Date.now() + orderSecondMinutes * 1000) },
                status: OrderStatus.CANCELLED,

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

    updateOrderDone(
        variantMap: Map<string, number>,
        orderId: bigint,
        tx?: PrismaClientTransaction,
    ) {
        const updateOrderAndVariant = async (db: PrismaClientTransaction) => {
            for (const [key, value] of variantMap) {
                await db.bookVariant.updateMany({
                    where: { id: BigInt(key) },
                    data: {
                        stock: { decrement: value },
                        reserved: { decrement: value }
                    }
                })
            }
            await db.order.update({
                where:
                    { id: orderId }
                ,
                data: {
                    status: OrderStatus.PAID
                }
            })
        };

        if (tx) {
            return updateOrderAndVariant(tx);
        }

        return this.prisma.$transaction(async (prismaTx) => {
            return updateOrderAndVariant(prismaTx);
        })
    }
}


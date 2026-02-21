import { PrismaService } from '@/database';
import { generateOrderCode } from '@/utils/generateOrderCode.util';
import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';

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

    createOrdersByUserId(userId: bigint) {
        const orderCode = generateOrderCode();
        return this.prisma.order.create({
            data: {
                userId: userId,
                orderCode: orderCode,
                paymentStatus: PaymentStatus.PENDING
            }
        })
    }

    createOrdersByGuestId(guestId: string) {
        const orderCode = generateOrderCode();
        return this.prisma.order.create({
            data: {
                guestSessionId: guestId,
                orderCode: orderCode,
                paymentStatus: PaymentStatus.PENDING
            }
        })
    }


}

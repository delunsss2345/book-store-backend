import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

export type OrderItemByUserRow = {
    quantity: number;
    bookVariantSnapshotId: bigint | null;
    bookVariantId: bigint | null;
    bookId: bigint | null;
};

@Injectable()
export class OrderItemRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByUserId(userId: bigint): Promise<OrderItemByUserRow[]> {
        const rows = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    userId,
                },
            },
            select: {
                quantity: true,
                bookVariantSnapshotId: true,
                bookVariantSnapshot: {
                    select: {
                        bookVariantId: true,
                        bookVariant: {
                            select: {
                                bookId: true,
                            },
                        },
                    },
                },
            },
        });

        return rows.map((row) => ({
            quantity: row.quantity,
            bookVariantSnapshotId: row.bookVariantSnapshotId,
            bookVariantId: row.bookVariantSnapshot?.bookVariantId ?? null,
            bookId: row.bookVariantSnapshot?.bookVariant?.bookId ?? null,
        }));
    }

    async findOrderIdsBySnapshotIds(snapshotIds: bigint[]) {
        const rows = await this.prisma.orderItem.findMany({
            where: { bookVariantSnapshotId: { in: snapshotIds } },
            select: { orderId: true },
        });
        return rows.map(r => r.orderId);
    }

    async findSnapshotIdsByOrderIds(orderIds: bigint[]) {
        const rows = await this.prisma.orderItem.findMany({
            where: { orderId: { in: orderIds } },
            select: { bookVariantSnapshotId: true },
        });
        return rows.map(r => r.bookVariantSnapshotId);
    }
    async groupAlsoBoughtSnapshotCandidates(orderIds: bigint[], excludeSnapshotIds: bigint[], take = 200) {
        return this.prisma.orderItem.groupBy({
            by: ['bookVariantSnapshotId'],
            where: {
                orderId: { in: orderIds },
                bookVariantSnapshotId: { notIn: excludeSnapshotIds }, // Không chứa những lần mua trước 
            },
            _count: { bookVariantSnapshotId: true },
            orderBy: { _count: { bookVariantSnapshotId: 'desc' } },
            take,
        });
    }

    async findPurchasedSnapshotIdsByUser(userId: bigint) {
        const rows = await this.prisma.orderItem.findMany({
            where: { order: { userId } },
            select: { bookVariantSnapshotId: true },
        });
        return rows.map(r => r.bookVariantSnapshotId);
    }

    createOrderItem(orderId: bigint, bookVariantSnapshotId: bigint, quantity: number, price: number) {
        return this.prisma.orderItem.create({
            data: {
                orderId,
                bookVariantSnapshotId,
                quantity,
                lineTotal: quantity * price,
                unitPrice: price,
            }
        })
    }
    /// Chưa fix bổ sug userId vào tìm chưa ra
    findOrderItemsByOrderId(orderId: bigint, userId: bigint, langId: number) {
        return this.prisma.orderItem.findMany({
            where: {
                orderId,
                order: {
                    userId,
                }
            },
            select: {
                quantity: true,
                bookVariantSnapshotId: true,
                bookVariantSnapshot: {
                    select: {
                        priceSnapshot: true,
                        bookVariantId: true,
                        bookVariant: {
                            select: {
                                book: {
                                    select: {
                                        coverImageUrl: true,
                                        id: true,
                                        translations: {
                                            where: { languageId: langId },
                                            select: {
                                                title: true,
                                                slug: true
                                            },
                                            take: 1
                                        }
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    findOrderDetailBySessionGuestId(orderId: bigint, sessionGuestId: string, langId: number) {
        return this.prisma.orderItem.findMany({
            where: {
                orderId,
                order: {
                    guestSessionId: sessionGuestId
                }
            },
            select: {
                quantity: true,
                bookVariantSnapshotId: true,
                bookVariantSnapshot: {
                    select: {
                        priceSnapshot: true,
                        bookVariantId: true,
                        bookVariant: {
                            select: {
                                book: {
                                    select: {
                                        coverImageUrl: true,
                                        id: true,
                                        translations: {
                                            where: { languageId: langId },
                                            select: {
                                                title: true,
                                                slug: true
                                            },
                                            take: 1
                                        }
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}


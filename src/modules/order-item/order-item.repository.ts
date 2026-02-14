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
}


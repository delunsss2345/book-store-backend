import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

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


}

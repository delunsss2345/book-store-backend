import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Khai báo include một lần để tái sử dụng và giữ type payload đồng nhất.
const wishlistWithItemsInclude = Prisma.validator<Prisma.WishlistInclude>()({
    items: {
        orderBy: { addedAt: 'desc' },
        select: {
            id: true,
            bookVariantId: true,
            addedAt: true,
            variant: {
                select: {
                    id: true,
                    price: true,
                    format: true,
                    currencyCode: true,
                    book: {
                        select: {
                            id: true,
                            translations: {
                                orderBy: { languageId: 'asc' },
                                take: 1,
                                select: {
                                    title: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
});

type WishlistWithItems = Prisma.WishlistGetPayload<{ include: typeof wishlistWithItemsInclude }>;

@Injectable()
export class WishlistRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByUserId(userId: bigint): Promise<WishlistWithItems | null> {
        const rows = await this.prisma.wishlist.findMany({
            where: {
                userId,
                deleteAt: null,
            },
            include: wishlistWithItemsInclude,
            orderBy: { updatedAt: 'desc' },
            take: 1,
        });
        return rows[0] ?? null;
    }

    async findByGuestSessionId(guestSessionId: string): Promise<WishlistWithItems | null> {
        const rows = await this.prisma.wishlist.findMany({
            where: {
                guestSessionId,
                deleteAt: null,
            },
            include: wishlistWithItemsInclude,
            orderBy: { updatedAt: 'desc' },
            take: 1,
        });
        return rows[0] ?? null;
    }

    createByUserId(userId: bigint): Promise<WishlistWithItems> {
        return this.prisma.wishlist.create({
            data: { userId },
            include: wishlistWithItemsInclude,
        });
    }

    createByGuestSessionId(guestSessionId: string): Promise<WishlistWithItems> {
        return this.prisma.wishlist.create({
            data: { guestSessionId },
            include: wishlistWithItemsInclude,
        });
    }

    softDeleteById(id: bigint) {
        return this.prisma.wishlist.update({
            where: { id },
            data: {
                deleteAt: new Date(),
            },
        });
    }
}

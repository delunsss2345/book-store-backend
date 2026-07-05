import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const buildWishlistWithItemsInclude = (languageId?: number): Prisma.WishlistInclude => ({
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
                    stock: true,
                    book: {
                        select: {
                            coverImageUrl: true,
                            id: true,
                            translations: {
                                ...(languageId ? { where: { languageId } } : {}),
                                orderBy: { languageId: 'asc' },
                                take: 1,
                                select: {
                                    title: true,
                                    description: true,
                                    slug: true
                                },
                            },
                        },
                    },
                },
            },
        },
    },
});

@Injectable()
export class WishlistRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByUserId(userId: number, languageId?: number) {
        const rows = await this.prisma.wishlist.findMany({
            where: {
                userId,
                deleteAt: null,
            },
            include: buildWishlistWithItemsInclude(languageId),
            orderBy: { updatedAt: 'desc' },
            take: 1,
        });
        return rows[0] ?? null;
    }

    async findByGuestSessionId(guestSessionId: string, languageId?: number) {
        const rows = await this.prisma.wishlist.findMany({
            where: {
                guestSessionId,
                deleteAt: null,
            },
            include: buildWishlistWithItemsInclude(languageId),
            orderBy: { updatedAt: 'desc' },
            take: 1,
        });
        return rows[0] ?? null;
    }

    createByUserId(userId: number, languageId?: number) {
        return this.prisma.wishlist.create({
            data: { userId },
            include: buildWishlistWithItemsInclude(languageId),
        });
    }

    createByGuestSessionId(guestSessionId: string, languageId?: number) {
        return this.prisma.wishlist.create({
            data: { guestSessionId },
            include: buildWishlistWithItemsInclude(languageId),
        });
    }

    softDeleteById(id: number) {
        return this.prisma.wishlist.update({
            where: { id },
            data: {
                deleteAt: new Date(),
            },
        });
    }
}

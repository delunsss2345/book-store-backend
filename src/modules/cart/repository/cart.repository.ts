import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Cart, Prisma } from '@prisma/client';

const buildCartWithItemsInclude = (languageId?: number): Prisma.CartInclude => ({
    items: {
        orderBy: { addedAt: 'desc' },
        select: {
            id: true,
            bookVariantId: true,
            quantity: true,
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
export class CartRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByUserId(userId: bigint, languageId?: number) {
        return this.prisma.cart.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: buildCartWithItemsInclude(languageId),
        });
    }

    createCartByGuestSessionId(guestSessionId: string, languageId?: number) {
        return this.prisma.cart.create({
            data: {
                guestSessionId,
            },
            include: buildCartWithItemsInclude(languageId),
        });
    }

    createCartByUserId(userId: bigint, languageId?: number) {
        return this.prisma.cart.create({
            data: {
                userId,
            },
            include: buildCartWithItemsInclude(languageId),
        });
    }


    createByUserId(userId: bigint): Promise<Cart> {
        return this.prisma.cart.create({
            data: { userId },
        });
    }

    createByGuestSessionId(guestSessionId: string): Promise<Cart> {
        return this.prisma.cart.create({
            data: { guestSessionId },
        });
    }

    findByGuestSessionId(guestSessionId: string, languageId?: number) {
        return this.prisma.cart.findFirst({
            where: { guestSessionId },
            include: buildCartWithItemsInclude(languageId),
            orderBy: { updatedAt: 'desc' },
        });
    }

    deleteByGuestSessionId(guestSessionId: string) {
        return this.prisma.cart.deleteMany({
            where: { guestSessionId },
        });
    }

    deleteByUserId(userId: bigint) {
        return this.prisma.cart.deleteMany({
            where: { userId },
        });
    }




}

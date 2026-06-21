import { PrismaClientTransaction, PrismaService } from '@/database';
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

    findByUserId(userId: number, languageId?: number) {
        return this.prisma.cart.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: buildCartWithItemsInclude(languageId),
        });
    }

    updateGuestCart(guestCartId: number, userId: number) {
        return this.prisma.cart.update({
            where: {
                id: guestCartId
            },
            data: {
                userId
            }
        })
    }

    updateCartByUserId(
        cartId: number,
        items: { bookVariantId: number; quantity: number }[],
    ) {
        return this.prisma.cart.update({
            where: { id: cartId },
            data: {
                items: {
                    upsert: items.map((item) => ({
                        where: {
                            cartId_bookVariantId: {
                                cartId,
                                bookVariantId: item.bookVariantId,
                            },
                        },
                        update: { quantity: item.quantity },
                        create: {
                            bookVariantId: item.bookVariantId,
                            quantity: item.quantity,
                        },
                    })),
                },
            },
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

    createCartByUserId(userId: number, languageId?: number) {
        return this.prisma.cart.create({
            data: {
                userId,
            },
            include: buildCartWithItemsInclude(languageId),
        });
    }


    createByUserId(userId: number): Promise<Cart> {
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


    findCartByGuestSessionId(guestSessionId: string, tx: PrismaClientTransaction = this.prisma) {
        return tx.cart.findFirst({
            where: { guestSessionId },
            include: {
                items: {
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
                            }
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }


    findCartByUserId(userId: number, tx: PrismaClientTransaction = this.prisma) {
        return tx.cart.findFirst({
            where: { userId },
            include: {
                items: {
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
                            }
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    deleteByGuestSessionId(guestSessionId: string) {
        return this.prisma.cart.deleteMany({
            where: { guestSessionId },
        });
    }

    deleteByUserId(userId: number) {
        return this.prisma.cart.deleteMany({
            where: { userId },
        });
    }

    findByGuestSessionIdForOrder(guestSessionId: string, tx: PrismaClientTransaction) {
        return tx.cart.findFirst({
            where: { guestSessionId },
            include: {
                items: {
                    select: {
                        id: true,
                        cartId: true,
                        bookVariantId: true,
                        quantity: true,
                        addedAt: true,
                        variant: {
                            include: {
                                book: {
                                    include: {
                                        translations: { select: { title: true, slug: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    findByCartIdAndUserId(cartId: number, userId: number, tx: PrismaClientTransaction) {
        return tx.cart.findFirst({
            where: { id: cartId, userId },
            include: {
                items: {
                    select: {
                        id: true,
                        cartId: true,
                        bookVariantId: true,
                        quantity: true,
                        addedAt: true,
                        variant: {
                            include: {
                                book: {
                                    include: {
                                        translations: { select: { title: true, slug: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
}

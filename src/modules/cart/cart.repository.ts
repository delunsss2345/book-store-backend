import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Cart, Prisma } from '@prisma/client';

const cartWithItemsInclude = Prisma.validator<Prisma.CartInclude>()({
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

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartWithItemsInclude }>;

@Injectable()
export class CartRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByUserId(userId: bigint): Promise<CartWithItems | null> {
        return this.prisma.cart.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: cartWithItemsInclude,
        });
    }

    createCartByGuestSessionId(guestSessionId: string): Promise<CartWithItems> {
        return this.prisma.cart.create({
            data: {
                guestSessionId,
            },
            include: cartWithItemsInclude,
        });
    }

    createCartByUserId(userId: bigint): Promise<CartWithItems> {
        return this.prisma.cart.create({
            data: {
                userId,
            },
            include: cartWithItemsInclude,
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

    findByGuestSessionId(guestSessionId: string): Promise<CartWithItems | null> {
        return this.prisma.cart.findFirst({
            where: { guestSessionId },
            include: cartWithItemsInclude,
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

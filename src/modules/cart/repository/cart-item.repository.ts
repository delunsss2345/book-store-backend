import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { CartItem } from '@prisma/client';

@Injectable()
export class CartItemRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByCartIdAndBookVariantId(cartId: number, bookVariantId: number): Promise<CartItem | null> {
        return this.prisma.cartItem.findFirst({
            where: { cartId, bookVariantId },
        });
    }

    findByIdAndGuestSessionId(id: number, guestSessionId: string): Promise<CartItem | null> {
        return this.prisma.cartItem.findFirst({
            where: {
                id,
                cart: {
                    guestSessionId,
                },
            },
        });
    }

    findByIdAndUserId(id: number, userId: number): Promise<CartItem | null> {
        return this.prisma.cartItem.findFirst({
            where: {
                id,
                cart: {
                    userId,
                },
            },
        });
    }

    updateQuantityById(id: number, quantity: number): Promise<CartItem> {
        return this.prisma.cartItem.update({
            where: { id },
            data: { quantity },
        });
    }
    createByCartIdAndBookVariantId(cartId: number, bookVariantId: number, quantity: number): Promise<CartItem> {
        return this.prisma.cartItem.create({
            data: {
                cartId,
                bookVariantId,
                quantity,
            },
        });
    }

    deleteByIdAndGuestSessionId(id: number, guestSessionId: string): Promise<number> {
        return this.prisma.cartItem
            .deleteMany({
                where: {
                    id,
                    cart: {
                        guestSessionId,
                    },
                },
            })
            .then((result) => result.count);
    }

    deleteByIdAndUserId(id: number, userId: number): Promise<number> {
        return this.prisma.cartItem
            .deleteMany({
                where: {
                    id,
                    cart: {
                        userId,
                    },
                },
            })
            .then((result) => result.count);
    }

    async getStockByBookVariantId(
        bookVariantId: number
    ): Promise<{ available: number } | null> {
        return this.prisma.bookVariant.findUnique({
            where: { id: bookVariantId },
            select: { available: true },
        });
    }
}

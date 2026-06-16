import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { CartItem } from '@prisma/client';

@Injectable()
export class CartItemRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByCartIdAndBookVariantId(cartId: bigint, bookVariantId: bigint): Promise<CartItem | null> {
        return this.prisma.cartItem.findFirst({
            where: { cartId, bookVariantId },
        });
    }

    findByIdAndGuestSessionId(id: bigint, guestSessionId: string): Promise<CartItem | null> {
        return this.prisma.cartItem.findFirst({
            where: {
                id,
                cart: {
                    guestSessionId,
                },
            },
        });
    }

    findByIdAndUserId(id: bigint, userId: bigint): Promise<CartItem | null> {
        return this.prisma.cartItem.findFirst({
            where: {
                id,
                cart: {
                    userId,
                },
            },
        });
    }

    updateQuantityById(id: bigint, quantity: number): Promise<CartItem> {
        return this.prisma.cartItem.update({
            where: { id },
            data: { quantity },
        });
    }
    createByCartIdAndBookVariantId(cartId: bigint, bookVariantId: bigint, quantity: number): Promise<CartItem> {
        return this.prisma.cartItem.create({
            data: {
                cartId,
                bookVariantId,
                quantity,
            },
        });
    }

    deleteByIdAndGuestSessionId(id: bigint, guestSessionId: string): Promise<number> {
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

    deleteByIdAndUserId(id: bigint, userId: bigint): Promise<number> {
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
        bookVariantId: bigint
    ): Promise<{ available: number } | null> {
        return this.prisma.bookVariant.findUnique({
            where: { id: bookVariantId },
            select: { available: true },
        });
    }
}

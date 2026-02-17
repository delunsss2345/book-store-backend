import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Cart } from '@prisma/client';

@Injectable()
export class CartRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByUserId(userId: bigint): Promise<Cart | null> {
        return this.prisma.cart.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
    }
    createCartByGuestSessionId(guestSessionId: string) {
        return this.prisma.cart.create({
            data: {
                guestSessionId
            },
            select: {
                items: true
            }
        })
    }

    createCartByUserId(userId: bigint) {
        return this.prisma.cart.create({
            data: {
                userId
            },
            select: {
                items: true
            }
        })
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

    findByGuestSessionId(guestSessionId: string) {
        return this.prisma.cart.findFirst({
            where: { guestSessionId },
            include: {
                items: {
                    select: {
                        id: true,
                        bookVariantId: true,
                        quantity: true,
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

    deleteByUserId(userId: bigint) {
        return this.prisma.cart.deleteMany({
            where: { userId },
        });
    }




}

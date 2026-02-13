import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { GuestSession } from '@prisma/client';

export type GuestSessionCleanupResult = {
    deletedCartItems: number;
    deletedCarts: number;
    deletedSessions: number;
};

@Injectable()
export class GuestSessionRepository {
    constructor(private readonly prisma: PrismaService) { }

    convertGuestSessionToUser(guestSessionId: string, userId: bigint) {
        return this.prisma.guestSession.updateMany({
            where: {
                id: guestSessionId,
            },
            data: {
                convertedUserId: userId,
                convertedAt: new Date(),
            },
        });
    }

    async updateGuestSessionSeenDate(guestSessionId: string): Promise<GuestSession | null> {
        const updated = await this.prisma.guestSession.updateMany({
            where: { id: guestSessionId },
            data: {
                lastSeenAt: new Date(),
            },
        });

        if (!updated.count) {
            return null;
        }

        return this.prisma.guestSession.findUnique({
            where: { id: guestSessionId },
        });
    }

    createGuestSession(ipFirst: string | null, userAgentHash: string | null): Promise<GuestSession> {
        return this.prisma.guestSession.create({
            data: {
                ipFirst,
                userAgentHash,
                lastSeenAt: new Date(),
            },
        });
    }

    getAllGuestSessions() {
        return this.prisma.guestSession.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }


    getGuestSessionById(guestSessionId: string) {
        return this.prisma.guestSession.findUnique({
            where: { id: guestSessionId },
        });
    }

    async cleanupInactiveGuestData(cutoff: Date): Promise<GuestSessionCleanupResult> {
        return this.prisma.$transaction(async (tx) => {
            const sessions = await tx.guestSession.findMany({
                where: {
                    convertedUserId: null,
                    OR: [
                        {
                            lastSeenAt: {
                                lt: cutoff,
                            },
                        },
                        {
                            lastSeenAt: null,
                            createdAt: {
                                lt: cutoff,
                            },
                        },
                    ],
                },
                select: { id: true },
            });

            if (!sessions.length) {
                return {
                    deletedCartItems: 0,
                    deletedCarts: 0,
                    deletedSessions: 0,
                };
            }

            const guestSessionIds = sessions.map((session) => session.id);
            const carts = await tx.cart.findMany({
                where: {
                    guestSessionId: {
                        in: guestSessionIds,
                    },
                },
                select: { id: true },
            });
            const cartIds = carts.map((cart) => cart.id);

            let deletedCartItems = 0;
            if (cartIds.length) {
                const cartItemsDeleteResult = await tx.cartItem.deleteMany({
                    where: {
                        cartId: {
                            in: cartIds,
                        },
                    },
                });
                deletedCartItems = cartItemsDeleteResult.count;
            }

            const deletedCartsResult = await tx.cart.deleteMany({
                where: {
                    guestSessionId: {
                        in: guestSessionIds,
                    },
                },
            });

            const deletedSessionsResult = await tx.guestSession.deleteMany({
                where: {
                    id: {
                        in: guestSessionIds,
                    },
                },
            });

            return {
                deletedCartItems,
                deletedCarts: deletedCartsResult.count,
                deletedSessions: deletedSessionsResult.count,
            };
        });
    }
}

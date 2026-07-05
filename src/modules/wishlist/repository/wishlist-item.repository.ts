import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { WishlistItem } from '@prisma/client';

@Injectable()
export class WishlistItemRepository {
    constructor(private readonly prisma: PrismaService) { }

    findByWishlistIdAndBookVariantId(
        wishlistId: number,
        bookVariantId: number,
    ): Promise<WishlistItem | null> {
        return this.prisma.wishlistItem.findFirst({
            where: { wishlistId, bookVariantId },
        });
    }

    createByWishlistIdAndBookVariantId(
        wishlistId: number,
        bookVariantId: number,
    ): Promise<WishlistItem> {
        return this.prisma.wishlistItem.create({
            data: {
                wishlistId,
                bookVariantId,
            },
        });
    }

    deleteByIdAndWishlistId(id: number, wishlistId: number): Promise<number> {
        return this.prisma.wishlistItem
            .deleteMany({
                where: {
                    id,
                    wishlistId,
                },
            })
            .then((result) => result.count);
    }
}

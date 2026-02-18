import { Injectable } from '@nestjs/common';
import { WishlistItemRepository } from './wishlist-item.repository';

@Injectable()
export class WishlistItemService {
    constructor(private readonly wishlistItemRepository: WishlistItemRepository) { }

    findByWishlistIdAndBookVariantId(wishlistId: bigint, bookVariantId: bigint) {
        return this.wishlistItemRepository.findByWishlistIdAndBookVariantId(
            wishlistId,
            bookVariantId,
        );
    }

    createByWishlistIdAndBookVariantId(wishlistId: bigint, bookVariantId: bigint) {
        return this.wishlistItemRepository.createByWishlistIdAndBookVariantId(
            wishlistId,
            bookVariantId,
        );
    }

    deleteByIdAndWishlistId(id: bigint, wishlistId: bigint) {
        return this.wishlistItemRepository.deleteByIdAndWishlistId(id, wishlistId);
    }
}

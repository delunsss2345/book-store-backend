import { Injectable } from '@nestjs/common';
import { WishlistItemRepository } from '../repository/wishlist-item.repository';

@Injectable()
export class WishlistItemService {
    constructor(private readonly wishlistItemRepository: WishlistItemRepository) { }

    findByWishlistIdAndBookVariantId(wishlistId: number, bookVariantId: number) {
        return this.wishlistItemRepository.findByWishlistIdAndBookVariantId(
            wishlistId,
            bookVariantId,
        );
    }

    createByWishlistIdAndBookVariantId(wishlistId: number, bookVariantId: number) {
        return this.wishlistItemRepository.createByWishlistIdAndBookVariantId(
            wishlistId,
            bookVariantId,
        );
    }

    deleteByIdAndWishlistId(id: number, wishlistId: number) {
        return this.wishlistItemRepository.deleteByIdAndWishlistId(id, wishlistId);
    }
}

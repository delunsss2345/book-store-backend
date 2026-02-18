import { Module } from '@nestjs/common';
import { WishlistItemRepository } from './wishlist-item.repository';
import { WishlistItemService } from './wishlist-item.service';

@Module({
    providers: [WishlistItemService, WishlistItemRepository],
    exports: [WishlistItemService, WishlistItemRepository],
})
export class WishlistItemModule { }

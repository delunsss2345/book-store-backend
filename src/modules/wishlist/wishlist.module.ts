import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthModule } from '@/modules/auth/auth.module';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { Module } from '@nestjs/common';
import { WishlistController } from './controller/wishlist.controller';
import { WishlistItemRepository } from './repository/wishlist-item.repository';
import { WishlistRepository } from './repository/wishlist.repository';
import { WishlistItemService } from './service/wishlist-item.service';
import { WishlistService } from './service/wishlist.service';

@Module({
    imports: [JwtProvider, GuestSessionModule, AuthModule],
    controllers: [WishlistController],
    providers: [
        WishlistService,
        WishlistItemService,
        WishlistRepository,
        WishlistItemRepository,
        ShopperSessionGuard,
    ],
    exports: [WishlistService, WishlistItemService],
})
export class WishlistModule { }

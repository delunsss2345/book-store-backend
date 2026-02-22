import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { LanguageModule } from '@/modules/language/language.module';
import { WishlistItemModule } from '@/modules/wishlist-item/wishlist-item.module';
import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistRepository } from './wishlist.repository';
import { WishlistService } from './wishlist.service';

@Module({
    imports: [JwtProvider, GuestSessionModule, WishlistItemModule, LanguageModule],
    controllers: [WishlistController],
    providers: [WishlistService, WishlistRepository, ShopperSessionGuard, AuthRepository],
    exports: [WishlistService],
})
export class WishlistModule { }

import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthModule } from '@/modules/auth/auth.module';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { Module } from '@nestjs/common';
import { CartController } from './controller/cart.controller';
import { CartItemRepository } from './repository/cart-item.repository';
import { CartRepository } from './repository/cart.repository';
import { CartItemService } from './service/cart-item.service';
import { CartService } from './service/cart.service';

@Module({
    imports: [JwtProvider, GuestSessionModule, AuthModule],
    controllers: [CartController],
    providers: [CartService, CartItemService, CartRepository, CartItemRepository, ShopperSessionGuard],
    exports: [CartService, CartItemService, CartRepository, CartItemRepository],
})
export class CartModule { }

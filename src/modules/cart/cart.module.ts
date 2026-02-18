import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { CartItemModule } from '@/modules/cart-item/cart-item.module';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

@Module({
    imports: [JwtProvider, CartItemModule, GuestSessionModule],
    controllers: [CartController],
    providers: [CartService, CartRepository, ShopperSessionGuard, AuthRepository],
    exports: [CartService],
})
export class CartModule { }

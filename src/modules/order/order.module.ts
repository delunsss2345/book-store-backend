import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { JwtProvider } from '@/config/jwt.config';
import { BookSnapShotModule } from '@/modules/book-snapshot/book-snapshot.module';
import { CartModule } from '@/modules/cart/cart.module';
import { CatalogModule } from '@/modules/catalog';
import { OrderAddressModule } from '@/modules/order-address/order-address.module';
import { OrderItemModule } from '@/modules/order-item/order-item.module';
import { Module } from '@nestjs/common';
import { AuthRepository } from '../auth/auth.repository';
import { GuestSessionModule } from '../guest-session/guest-session.module';
import { PaymentModule } from '../payment/payment.module';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

@Module({
    imports: [PaymentModule, JwtProvider, GuestSessionModule, OrderItemModule, OrderAddressModule, CartModule, CatalogModule, BookSnapShotModule],
    controllers: [OrderController],
    providers: [OrderRepository, OrderService, ShopperSessionGuard, AuthRepository],
    exports: [OrderRepository, OrderService],
})
export class OrderModule { }


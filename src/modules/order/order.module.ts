import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthModule } from '@/modules/auth/auth.module';
import { CatalogModule } from '@/modules/book/catalog/catalog.module';
import { BookSnapShotModule } from '@/modules/book/snapshot/book-snapshot.module';
import { BookVariantModule } from '@/modules/book/variant/bookVariant.module';
import { CartModule } from '@/modules/cart/cart.module';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { OrderCleanupJob } from '@/modules/order/job/order.cleanup.job';
import { EmailModule } from '@/queue/email/email.module';
import { Module } from '@nestjs/common';
import { AuthRepository } from '../auth/repository/auth.repository';
import { GuestSessionModule } from '../guest-session/guest-session.module';
import { PaymentModule } from '../payment/payment.module';
import { UserModule } from '../user/user.module';
import { OrderController } from './controller/order.controller';
import { OrderAddressRepository } from './repository/order-address.repository';
import { OrderItemRepository } from './repository/order-item.repository';
import { OrderRepository } from './repository/order.repository';
import { OrderAddressService } from './service/order-address.service';
import { OrderItemService } from './service/order-item.service';
import { OrderService } from './service/order.service';

@Module({
  imports: [
    PaymentModule,
    JwtProvider,
    AuthModule,
    GuestSessionModule,
    CartModule,
    CatalogModule,
    BookSnapShotModule,
    BookVariantModule,
    EmailOutboxModule,
    EmailModule,
    UserModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderCleanupJob,
    OrderRepository,
    OrderItemRepository,
    OrderItemService,
    OrderAddressRepository,
    OrderAddressService,
    OrderService,
    ShopperSessionGuard,
    AuthRepository,
  ],
  exports: [
    OrderRepository,
    OrderItemRepository,
    OrderItemService,
    OrderAddressRepository,
    OrderAddressService,
    OrderService,
  ],
})
export class OrderModule { }

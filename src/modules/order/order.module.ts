import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { JwtProvider } from '@/config/jwt.config';
import { AuthModule } from '@/modules/auth/auth.module';
import { BookSnapShotModule } from '@/modules/book/snapshot/book-snapshot.module';
import { CartModule } from '@/modules/cart/cart.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { OrderCleanupJob } from '@/modules/order/job/order.cleanup.job';
import { Module } from '@nestjs/common';
import { AuthRepository } from '../auth/repository/auth.repository';
import { GuestSessionModule } from '../guest-session/guest-session.module';
import { PaymentModule } from '../payment/payment.module';
import { OrderController } from './controller/order.controller';
import { OrderAddressRepository } from './repository/order-address.repository';
import { OrderItemRepository } from './repository/order-item.repository';
import { OrderRepository } from './repository/order.repository';
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
        EmailOutboxModule,
        JobsModule],
    controllers: [OrderController],
    providers: [
        OrderCleanupJob,
        OrderRepository,
        OrderItemRepository,
        OrderAddressRepository,
        OrderService,
        ShopperSessionGuard,
        AuthRepository,
    ],
    exports: [OrderRepository, OrderItemRepository, OrderAddressRepository, OrderService],
})
export class OrderModule { }

import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { JwtProvider } from '@/config/jwt.config';
import { BookSnapShotModule } from '@/modules/book-snapshot/book-snapshot.module';
import { CartModule } from '@/modules/cart/cart.module';
import { CatalogModule } from '@/modules/catalog';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { OrderAddressModule } from '@/modules/order-address/order-address.module';
import { OrderItemModule } from '@/modules/order-item/order-item.module';
import { OrderCleanupJob } from '@/modules/order/order.cleanup.job';
import { PaymentIntentModule } from '@/modules/payment-intent';
import { Module } from '@nestjs/common';
import { AuthRepository } from '../auth/auth.repository';
import { GuestSessionModule } from '../guest-session/guest-session.module';
import { PaymentModule } from '../payment/payment.module';
import { OrderController } from './order.controller';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

@Module({
    imports: [PaymentModule, PaymentIntentModule, JwtProvider, GuestSessionModule, OrderItemModule, OrderAddressModule, CartModule, CatalogModule, BookSnapShotModule, EmailOutboxModule, JobsModule],
    controllers: [OrderController],
    providers: [OrderCleanupJob, OrderRepository, OrderService, ShopperSessionGuard, AuthRepository],
    exports: [OrderRepository, OrderService],
})
export class OrderModule { }


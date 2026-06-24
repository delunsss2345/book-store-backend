import { BookSnapShotModule } from '@/modules/book/snapshot/book-snapshot.module';
import { BookVariantModule } from '@/modules/book/variant/bookVariant.module';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { OrderAddressRepository } from '@/modules/order/repository/order-address.repository';
import { OrderItemRepository } from '@/modules/order/repository/order-item.repository';
import { OrderRepository } from '@/modules/order/repository/order.repository';
import { OrderAddressService } from '@/modules/order/service/order-address.service';
import { OrderItemService } from '@/modules/order/service/order-item.service';
import { EmailModule } from '@/queue/email/email.module';
import { OrderQueueProvider, RedisProvider } from '@/config/redis.config';
import { Module } from '@nestjs/common';
import { CheckoutProcessor } from './checkout.processor';

@Module({
  imports: [
    RedisProvider,
    OrderQueueProvider,
    BookVariantModule,
    BookSnapShotModule,
    EmailOutboxModule,
    EmailModule,
  ],
  providers: [
    CheckoutProcessor,
    OrderRepository,
    OrderItemRepository,
    OrderItemService,
    OrderAddressRepository,
    OrderAddressService,
  ],
})
export class CheckoutProcessorModule {}

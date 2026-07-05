import { BullMqModule, OrderQueueProvider } from '@/config/redis.config';
import { BookSnapShotModule } from '@/modules/book/snapshot/book-snapshot.module';
import { BookVariantModule } from '@/modules/book/variant/bookVariant.module';
import { EmailOutboxModule } from '@/modules/email-outbox/email-outbox.module';
import { OrderModule } from '@/modules/order/order.module';
import { OrderAddressRepository } from '@/modules/order/repository/order-address.repository';
import { OrderItemRepository } from '@/modules/order/repository/order-item.repository';
import { OrderAddressService } from '@/modules/order/service/order-address.service';
import { OrderItemService } from '@/modules/order/service/order-item.service';
import { EmailModule } from '@/queue/email/email.module';
import { Module } from '@nestjs/common';
import { CheckoutProcessor } from './checkout.processor';

@Module({
  imports: [
    BullMqModule,
    OrderQueueProvider,
    BookVariantModule,
    BookSnapShotModule,
    EmailOutboxModule,
    EmailModule,
    OrderModule,
  ],
  providers: [
    CheckoutProcessor,
    OrderItemRepository,
    OrderItemService,
    OrderAddressRepository,
    OrderAddressService,
  ],
})
export class CheckoutProcessorModule { }

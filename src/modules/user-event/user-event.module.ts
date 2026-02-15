import { BookSnapShotModule } from '@/modules/book-snapshot/book-snapshot.module';
import { CatalogModule } from '@/modules/catalog';
import { OrderItemModule } from '@/modules/order-item/order-item.module';
import { OrderModule } from '@/modules/order/order.module';
import { Module } from '@nestjs/common';
import { UserEventController } from './user-event.controller';
import { UserEventRepository } from './user-event.repository';
import { UserEventService } from './user-event.service';

@Module({
    imports: [OrderItemModule, OrderModule, BookSnapShotModule, CatalogModule],
    controllers: [UserEventController],
    providers: [UserEventService, UserEventRepository],
    exports: [UserEventService, UserEventRepository],
})
export class UserEventModule { }

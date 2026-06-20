import { BookSnapShotModule } from '@/modules/book/snapshot/book-snapshot.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { OrderModule } from '@/modules/order/order.module';
import { Module } from '@nestjs/common';
import { UserEventController } from './controller/user-event.controller';
import { UserEventRepository } from './repository/user-event.repository';
import { UserEventService } from './service/user-event.service';

@Module({
    imports: [OrderModule, BookSnapShotModule, CatalogModule],
    controllers: [UserEventController],
    providers: [UserEventService, UserEventRepository],
    exports: [UserEventService, UserEventRepository],
})
export class UserEventModule { }

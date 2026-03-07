import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { AuthorModule } from '@/modules/author/author.module';
import { LanguageModule } from '@/modules/language/language.module';
import { PublisherModule } from '@/modules/publisher/publisher.module';
import { Module } from '@nestjs/common';
import { AdminBookRepository } from './book/admin-book.repository';
import { AdminBookService } from './book/admin-book.service';
import { AdminOrderRepository } from './order/admin-order.repository';
import { AdminOrderService } from './order/admin-order.service';
import { AdminUserRepository } from './user/admin-user.repository';
import { AdminUserService } from './user/admin-user.service';
import { AdminBookController } from './controllers/admin-book.controller';
import { AdminBookSnapshotController } from './controllers/admin-book-snapshot.controller';
import { AdminBookTranslationController } from './controllers/admin-book-translation.controller';
import { AdminOrderController } from './controllers/admin-order.controller';
import { AdminOrderDetailController } from './controllers/admin-order-detail.controller';
import { AdminUserController } from './controllers/admin-user.controller';

@Module({
  imports: [LanguageModule, AuditLogModule, PublisherModule, AuthorModule],
  controllers: [
    AdminBookController,
    AdminBookTranslationController,
    AdminBookSnapshotController,
    AdminUserController,
    AdminOrderController,
    AdminOrderDetailController,
  ],
  providers: [
    AdminBookService,
    AdminBookRepository,
    AdminUserService,
    AdminUserRepository,
    AdminOrderService,
    AdminOrderRepository,
  ],
  exports: [
    AdminBookService,
    AdminBookRepository,
    AdminUserService,
    AdminUserRepository,
    AdminOrderService,
    AdminOrderRepository,
  ],
})
export class AdminModule {}

import { CacheProvider } from '@/config/redis.config';
import { AdminBookVariantsRepository } from '@/modules/admin/book-variant/admin-book-variant.repository';
import { AdminBookVariantsService } from '@/modules/admin/book-variant/admin-book-variant.service';
import { AdminBookVariantController } from '@/modules/admin/controllers/admin-book-variants.controller';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { AuthorModule } from '@/modules/author/author.module';
import { LanguageModule } from '@/modules/language/language.module';
import { PublisherModule } from '@/modules/publisher/publisher.module';
import { SupplierModule } from '@/modules/supplier/supplier.module';
import { Module } from '@nestjs/common';
import { AdminBookRepository } from './book/admin-book.repository';
import { AdminBookService } from './book/admin-book.service';
import { AdminCategoryRepository } from './categories/admin-category.repository';
import { AdminCategoryService } from './categories/admin-category.service';
import { AdminBookSnapshotController } from './controllers/admin-book-snapshot.controller';
import { AdminBookTranslationController } from './controllers/admin-book-translation.controller';
import { AdminBookController } from './controllers/admin-book.controller';
import { AdminCategoryController } from './controllers/admin-category.controller';
import { AdminOrderDetailController } from './controllers/admin-order-detail.controller';
import { AdminOrderController } from './controllers/admin-order.controller';
import { AdminStockImportController } from './controllers/admin-stock-import.controller';
import { AdminUserController } from './controllers/admin-user.controller';
import { AdminOrderRepository } from './order/admin-order.repository';
import { AdminOrderService } from './order/admin-order.service';
import { AdminStockImportRepository } from './stock-import/admin-stock-import.repository';
import { AdminStockImportService } from './stock-import/admin-stock-import.service';
import { AdminUserRepository } from './user/admin-user.repository';
import { AdminUserService } from './user/admin-user.service';

@Module({
  imports: [
    CacheProvider,
    LanguageModule,
    AuditLogModule,
    PublisherModule,
    AuthorModule,
    SupplierModule
  ],
  controllers: [
    AdminBookController,
    AdminBookTranslationController,
    AdminBookSnapshotController,
    AdminCategoryController,
    AdminUserController,
    AdminOrderController,
    AdminOrderDetailController,
    AdminBookVariantController,
    AdminStockImportController,
  ],
  providers: [
    AdminBookService,
    AdminBookRepository,
    AdminBookVariantsService,
    AdminBookVariantsRepository,
    AdminUserService,
    AdminUserRepository,
    AdminCategoryService,
    AdminCategoryRepository,
    AdminOrderService,
    AdminOrderRepository,
    AdminStockImportService,
    AdminStockImportRepository,
  ],
  exports: [
    AdminBookService,
    AdminBookVariantsService,
    AdminBookRepository,
    AdminBookVariantsRepository,
    AdminUserService,
    AdminUserRepository,
    AdminCategoryService,
    AdminCategoryRepository,
    AdminOrderService,
    AdminOrderRepository,
    AdminStockImportService,
    AdminStockImportRepository,
  ],
})
export class AdminModule { }

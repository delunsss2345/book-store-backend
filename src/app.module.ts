import { SecurityModule } from '@/common/security/security.module';
import { CONFIGURATION, TConfiguration } from '@/config';
import { RateLimitProvider } from '@/config/ratelimit.config';
import { AdminBookVariantModule } from '@/modules/admin/book-variant/admin-book-variant.module';
import { AdminBookModule } from '@/modules/admin/book/admin-book.module';
import { AdminCategoryModule } from '@/modules/admin/category/admin-category.module';
import { AdminOrderModule } from '@/modules/admin/order/admin-order.module';
import { AdminPurchaseOrderModule } from '@/modules/admin/purchase-order/admin-purchase-order.module';
import { AdminStockImportModule } from '@/modules/admin/stock-import/admin-stock-import.module';
import { AdminUserModule } from '@/modules/admin/user/admin-user.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { AuthorModule } from '@/modules/author/author.module';
import { BookAssetModule } from '@/modules/book/asset/book-asset.module';
import { CatalogModule } from '@/modules/book/catalog/catalog.module';
import { BookVariantModule } from '@/modules/book/variant';
import { CartModule } from '@/modules/cart/cart.module';
import { CategoryModule } from '@/modules/category/category.module';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { HealthModule } from '@/modules/health/health.module';
import { LanguageModule } from '@/modules/language/language.module';
import { PermissionScanModule } from '@/modules/permission-scan/permission-scan.module';
import { PublisherModule } from '@/modules/publisher/publisher.module';
import { RedisModule } from '@/modules/redis/redis.module';
import { SearchModule } from '@/modules/search/search.module';
import { SupplierModule } from '@/modules/supplier/supplier.module';
import { UserEventModule } from '@/modules/user-event/user-event.module';
import { UserModule } from '@/modules/user/user.module';
import { WishlistModule } from '@/modules/wishlist/wishlist.module';
import { CheckoutModule } from '@/queue/checkout/checkout.module';
import { EmailModule } from '@/queue/email/email.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LanguageMiddleware } from './common/middleware/language.middleware';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth/auth.module';
import { HooksModule } from './modules/hooks/hooks.module';
import { OrderModule } from './modules/order/order.module';
import { PermissionModule } from './modules/permission/permission.module';
import { R2ServiceModule } from './modules/r2-service/r2-service.module';
import { RoleModule } from './modules/role/role.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';

@Module({
  imports: [
    DatabaseModule,
    TransactionModule,
    SecurityModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    RateLimitProvider,
    VerificationCodeModule,
    PermissionScanModule,
    EmailModule,
    CheckoutModule,
    PermissionModule,
    RoleModule,
    AuditLogModule,
    AdminBookModule,
    AdminBookVariantModule,
    AdminCategoryModule,
    AdminOrderModule,
    AdminStockImportModule,
    AdminUserModule,
    AdminPurchaseOrderModule,
    BookAssetModule,
    HealthModule,
    UserModule,
    CatalogModule,
    CategoryModule,
    CartModule,
    GuestSessionModule,
    PublisherModule,
    AuthorModule,
    SupplierModule,
    UserEventModule,
    SearchModule,
    WishlistModule,
    OrderModule,
    HooksModule,
    LanguageModule,
    UploadsModule,
    R2ServiceModule,
    BookVariantModule,
  ],
})
export class AppModule implements NestModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageMiddleware).forRoutes('*');
  }
}

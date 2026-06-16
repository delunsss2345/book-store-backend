import { SecurityModule } from '@/common/security/security.module';
import { CONFIGURATION, TConfiguration } from '@/config';
import { RateLimitProvider } from '@/config/ratelimit.config';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { AuthorModule } from '@/modules/author/author.module';
import { BookAssetModule } from '@/modules/book/asset/book-asset.module';
import { BookVariantModule } from '@/modules/book/variant';
import { CartModule } from '@/modules/cart/cart.module';
import { CatalogModule } from '@/modules/catalog';
import { CategoryModule } from '@/modules/category/category.module';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { HealthModule } from '@/modules/health/health.module';
import { LanguageModule } from '@/modules/language/language.module';
import { PublisherModule } from '@/modules/publisher/publisher.module';
import { PurchaseOrderModule } from '@/modules/purchase-order';
import { SearchModule } from '@/modules/search/search.module';
import { StockImportModule } from '@/modules/stock-import';
import { SupplierModule } from '@/modules/supplier/supplier.module';
import { UserModule } from '@/modules/user/user.module';
import { UserEventModule } from '@/modules/user-event/user-event.module';
import { WishlistModule } from '@/modules/wishlist/wishlist.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LanguageMiddleware } from './common/middleware/language.middleware';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth/auth.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { HooksModule } from './modules/hooks/hooks.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { OrderModule } from './modules/order/order.module';
import { PermissionModule } from './modules/permission/permission.module';
import { R2ServiceModule } from './modules/r2-service/r2-service.module';
import { RoleModule } from './modules/role/role.module';
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
    RateLimitProvider,
    VerificationCodeModule,
    MailModule,
    JobsModule,
    PermissionModule,
    RoleModule,
    AuditLogModule,
    AdminModule,
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
    PurchaseOrderModule,
    StockImportModule,
    BookVariantModule,
  ],
})
export class AppModule implements NestModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageMiddleware).forRoutes('*');
  }
}

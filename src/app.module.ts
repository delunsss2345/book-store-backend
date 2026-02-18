import { SecurityModule } from '@/common/security/security.module';
import { CONFIGURATION, TConfiguration } from '@/config';
import { RateLimitProvider } from '@/config/ratelimit.config';
import { AuthorModule } from '@/modules/author/author.module';
import { CartModule } from '@/modules/cart/cart.module';
import { CatalogModule } from '@/modules/catalog';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { HealthModule } from '@/modules/health/health.module';
import { PublisherModule } from '@/modules/publisher/publisher.module';
import { ReviewModule } from '@/modules/review/review.module';
import { SearchModule } from '@/modules/search/search.module';
import { UserEventModule } from '@/modules/user-event/user-event.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { UserAddressModule } from './modules/user-address/user-address.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';

@Module({
  imports: [
    DatabaseModule,
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
    HealthModule,
    UserAddressModule,
    CatalogModule,
    CartModule,
    GuestSessionModule,
    ReviewModule,
    PublisherModule,
    AuthorModule,
    UserEventModule,
    SearchModule
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

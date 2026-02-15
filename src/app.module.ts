import { SecurityModule } from '@/common/security/security.module';
import { CONFIGURATION, TConfiguration } from '@/config';
import { AuthorModule } from '@/modules/author/author.module';
import { CartModule } from '@/modules/cart/cart.module';
import { CatalogModule } from '@/modules/catalog';
import { GuestSessionModule } from '@/modules/guest-session/guest-session.module';
import { HealthModule } from '@/modules/health/health.module';
import { PublisherModule } from '@/modules/publisher/publisher.module';
import { ReviewModule } from '@/modules/review/review.module';
import { UserEventModule } from '@/modules/user-event/user-event.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const limitRaw = Number(
          configService.get<number | string>('RATE_LIMIT_LIMIT') ?? 120,
        );
        const ttlRaw = Number(
          configService.get<number | string>('RATE_LIMIT_TTL') ?? 60000,
        );

        const limit =
          Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 120;
        const ttl = Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 60000;

        return [
          {
            limit,
            ttl,
          },
        ];
      },
    }),
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
    UserEventModule
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

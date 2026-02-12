import { SecurityModule } from '@/common/security/security.module';
import { CONFIGURATION, TConfiguration } from '@/config';
import { CatalogModule } from '@/modules/catalog';
import { HealthModule } from '@/modules/health/health.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

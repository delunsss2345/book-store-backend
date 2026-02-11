import { SecurityModule } from '@/common/security/security.module';
import { CONFIGURATION, TConfiguration } from '@/config';
import { CatalogModule } from '@/modules/catalog';
import { HealthModule } from '@/modules/health/health.module';
import { Module } from '@nestjs/common';
import { ConfigModule, } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { UserAddressModule } from './modules/user-address/user-address.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';

@Module({
  imports: [DatabaseModule, SecurityModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, load: [() => CONFIGURATION]
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
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

import { CONFIGURATION, TConfiguration } from '@/config';
import { PermissionGuardModule } from '@/common/guard/permission-guard.module';
import { HealthModule } from '@/modules/health/health.module';
import { Module } from '@nestjs/common';
import { ConfigModule, } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RoleModule } from './modules/role/role.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';

@Module({
  imports: [DatabaseModule, PermissionGuardModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, load: [() => CONFIGURATION]
    }),
    VerificationCodeModule,
    MailModule,
    JobsModule,
    PermissionModule,
    RoleModule,
    HealthModule
  ],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

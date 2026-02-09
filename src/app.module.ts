import { CONFIGURATION, TConfiguration } from '@/config';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { RoleModule } from './modules/role/role.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';

@Module({
  imports: [DatabaseModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, load: [() => CONFIGURATION]
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60_000, // ms
    }),
    VerificationCodeModule,
    MailModule,
    JobsModule,
    RoleModule,
  ],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

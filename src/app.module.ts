import { CONFIGURATION, TConfiguration } from '@/config';
import { Module } from '@nestjs/common';
import { ConfigModule, } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';

@Module({
  imports: [DatabaseModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, load: [() => CONFIGURATION]
    }),
    VerificationCodeModule,
    MailModule,
    JobsModule,
  ],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

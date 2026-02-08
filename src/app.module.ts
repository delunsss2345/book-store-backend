import { CONFIGURATION, TConfiguration } from '@/config';
import { Module } from '@nestjs/common';
import { ConfigModule, } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';
import { VerificationCodeModule } from './modules/verification-code/verification-code.module';
import { MailModule } from './modules/mail/mail.module';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [DatabaseModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, load: [() => CONFIGURATION]
    }),
    VerificationCodeModule,
    MailModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

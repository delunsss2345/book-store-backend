import { CONFIGURATION, TConfiguration } from '@/config';
import { JwtAuthModule } from '@/modules/jwt/jwt.module';
import { Module } from '@nestjs/common';
import { ConfigModule, } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';

@Module({
  imports: [DatabaseModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, load: [() => CONFIGURATION]
    }),
    JwtAuthModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}

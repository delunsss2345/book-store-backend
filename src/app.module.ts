import { CONFIGURATION } from '@/config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';

@Module({
  imports: [DatabaseModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, load: [() => CONFIGURATION]
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

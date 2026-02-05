import { Module } from '@nestjs/common';
import { JwtAuthController } from './jwt.controller';
import { JwtAuthService } from './jwt.service';

@Module({
  controllers: [JwtAuthController],
  providers: [JwtAuthService],
})
export class JwtAuthModule { }

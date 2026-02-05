import { JwtProvider } from '@/config/jwt.config';
import { Module } from '@nestjs/common';
import { JwtAuthService } from './jwt.service';

@Module({
  imports: [JwtProvider],
  providers: [JwtAuthService],
})
export class JwtAuthModule { }

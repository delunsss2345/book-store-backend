import { Module } from '@nestjs/common';
import { R2ServiceService } from './r2-service.service';
import { R2ServiceController } from './r2-service.controller';

@Module({
  controllers: [R2ServiceController],
  providers: [R2ServiceService],
})
export class R2ServiceModule {}

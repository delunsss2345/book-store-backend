import { Module } from '@nestjs/common';
import { R2ServiceService } from './service/r2-service.service';
import { R2ServiceController } from './controller/r2-service.controller';

@Module({
  controllers: [R2ServiceController],
  providers: [R2ServiceService],
})
export class R2ServiceModule {}

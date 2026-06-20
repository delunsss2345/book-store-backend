import { Module } from '@nestjs/common';
import { UploadsService } from './service/uploads.service';
import { UploadsController } from './controller/uploads.controller';
import { R2ServiceService } from '../r2-service/service/r2-service.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, R2ServiceService],
  exports: [UploadsService],
})
export class UploadsModule {}

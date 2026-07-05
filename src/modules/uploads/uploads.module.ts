import { Module } from '@nestjs/common';
import { UploadsController } from './controller/uploads.controller';
import { R2ServiceService } from './r2-service/service/r2-service.service';
import { UploadsService } from './service/uploads.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, R2ServiceService],
  exports: [UploadsService],
})
export class UploadsModule { }

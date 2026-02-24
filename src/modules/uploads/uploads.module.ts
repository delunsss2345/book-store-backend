import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { R2ServiceService } from '../r2-service/r2-service.service';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, R2ServiceService],
  exports: [UploadsService],
})
export class UploadsModule {}

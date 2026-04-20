import { Module } from '@nestjs/common';
import { BookAssetController } from './book-asset.controller';
import { BookAssetService } from './book-asset.service';
import BookAssetRepository from './book-asset.repository';
import { R2ServiceService } from '../r2-service/r2-service.service';

@Module({
  controllers: [BookAssetController],
  providers: [BookAssetService, BookAssetRepository, R2ServiceService],
  exports: [BookAssetService],
})
export class BookAssetModule {}

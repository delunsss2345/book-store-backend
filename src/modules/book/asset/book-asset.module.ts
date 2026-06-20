import { BookAssetController } from '@/modules/book/asset/controller/book-asset.controller';
import { Module } from '@nestjs/common';
import { R2ServiceService } from '../../r2-service/service/r2-service.service';
import BookAssetRepository from './repository/book-asset.repository';
import { BookAssetService } from './service/book-asset.service';

@Module({
  controllers: [BookAssetController],
  providers: [BookAssetService, BookAssetRepository, R2ServiceService],
  exports: [BookAssetService],
})
export class BookAssetModule { }

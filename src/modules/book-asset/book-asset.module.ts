import { Module } from '@nestjs/common';
import { BookAssetController } from './book-asset.controller';
import { BookAssetService } from './book-asset.service';
import { UploadsModule } from '../uploads/uploads.module';
import BookAssetRepository from './book-asset.repository';

@Module({
  imports: [UploadsModule],
  controllers: [BookAssetController],
  providers: [BookAssetService, BookAssetRepository],
  exports: [BookAssetService],
})
export class BookAssetModule {}

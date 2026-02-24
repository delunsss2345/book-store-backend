import { Module } from '@nestjs/common';
import { BookAssetController } from './book-asset.controller';
import { BookAssetService } from './book-asset.service';

@Module({
    controllers: [BookAssetController],
    providers: [BookAssetService],
    exports: [BookAssetService],
})
export class BookAssetModule { }

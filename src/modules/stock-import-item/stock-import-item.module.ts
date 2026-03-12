import { Module } from '@nestjs/common';
import { StockImportItemRepository } from './stock-import-item.repository';
import { StockImportItemService } from './stock-import-item.service';

@Module({
  providers: [StockImportItemRepository, StockImportItemService],
  exports: [StockImportItemRepository, StockImportItemService],
})
export class StockImportItemModule {}

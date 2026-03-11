import { Module } from '@nestjs/common';
import { StockImportItemRepository } from './stock-import-item.repository';

@Module({
  providers: [StockImportItemRepository],
  exports: [StockImportItemRepository],
})
export class StockImportItemModule {}

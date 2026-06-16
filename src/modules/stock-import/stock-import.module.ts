import { Module } from '@nestjs/common';
import { StockImportController } from './controller/stock-import.controller';
import { StockImportItemController } from './controller/stock-import-item.controller';
import { StockImportItemRepository } from './repository/stock-import-item.repository';
import { StockImportRepository } from './repository/stock-import.repository';
import { StockImportItemService } from './service/stock-import-item.service';
import { StockImportService } from './service/stock-import.service';

@Module({
  controllers: [StockImportController, StockImportItemController],
  providers: [
    StockImportRepository,
    StockImportItemRepository,
    StockImportService,
    StockImportItemService,
  ],
  exports: [
    StockImportRepository,
    StockImportItemRepository,
    StockImportService,
    StockImportItemService,
  ],
})
export class StockImportModule { }

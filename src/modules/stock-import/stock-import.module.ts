import { Module } from '@nestjs/common';
import { StockImportController } from './stock-import.controller';
import { StockImportRepository } from './stock-import.repository';
import { StockImportService } from './stock-import.service';

@Module({
  controllers: [StockImportController],
  providers: [StockImportRepository, StockImportService],
  exports: [StockImportRepository, StockImportService],
})
export class StockImportModule {}

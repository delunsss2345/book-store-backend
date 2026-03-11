import { Module } from '@nestjs/common';
import { StockImportRepository } from './stock-import.repository';

@Module({
  providers: [StockImportRepository],
  exports: [StockImportRepository],
})
export class StockImportModule {}

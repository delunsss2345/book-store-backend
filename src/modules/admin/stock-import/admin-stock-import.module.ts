import { Module } from '@nestjs/common';
import { AdminStockImportController } from './controller/admin-stock-import.controller';
import { AdminStockImportRepository } from './repository/admin-stock-import.repository';
import { AdminStockImportService } from './service/admin-stock-import.service';

@Module({
  controllers: [AdminStockImportController],
  providers: [AdminStockImportService, AdminStockImportRepository],
  exports: [AdminStockImportService, AdminStockImportRepository],
})
export class AdminStockImportModule { }

import { AdminBookVariantModule } from '@/modules/admin/book-variant/admin-book-variant.module';
import { AdminPurchaseOrderModule } from '@/modules/admin/purchase-order/admin-purchase-order.module';
import { Module } from '@nestjs/common';
import { AdminStockImportController } from './controller/admin-stock-import.controller';
import { AdminStockImportRepository } from './repository/admin-stock-import.repository';
import { AdminStockImportService } from './service/admin-stock-import.service';

@Module({
  imports: [AdminPurchaseOrderModule, AdminBookVariantModule],
  controllers: [AdminStockImportController],
  providers: [AdminStockImportService, AdminStockImportRepository],
  exports: [AdminStockImportService, AdminStockImportRepository],
})
export class AdminStockImportModule { }

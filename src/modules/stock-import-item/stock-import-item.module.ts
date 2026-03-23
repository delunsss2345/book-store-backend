import { LanguageModule } from '@/modules/language/language.module';
import { Module } from '@nestjs/common';
import { StockImportItemController } from './stock-import-item.controller';
import { StockImportItemRepository } from './stock-import-item.repository';
import { StockImportItemService } from './stock-import-item.service';

@Module({
  imports: [LanguageModule],
  controllers: [StockImportItemController],
  providers: [StockImportItemRepository, StockImportItemService],
  exports: [StockImportItemRepository, StockImportItemService],
})
export class StockImportItemModule {}

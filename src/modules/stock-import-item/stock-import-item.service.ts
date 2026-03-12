import { Injectable } from '@nestjs/common';
import { StockImportItemRepository } from './stock-import-item.repository';

@Injectable()
export class StockImportItemService {
  constructor(
    private readonly stockImportItemRepository: StockImportItemRepository,
  ) {}

  createStockImportItemsFromPurchaseOrder(
    purchaseOrderId: string,
    stockImportId: string,
  ) {
    throw new Error('Method not implemented.');
  }

  getStockImportItemsByStockImportId(stockImportId: string) {
    throw new Error('Method not implemented.');
  }
}

import { Injectable } from '@nestjs/common';
import {
  CreateStockImportFromPurchaseOrderDto,
  GetStockImportsQueryDto,
} from './dto';
import { StockImportRepository } from './stock-import.repository';

@Injectable()
export class StockImportService {
  constructor(private readonly stockImportRepository: StockImportRepository) {}

  createStockImportFromPurchaseOrder(
    purchaseOrderId: string,
    createdById: bigint,
    body?: CreateStockImportFromPurchaseOrderDto,
  ) {
    throw new Error('Method not implemented.');
  }

  getStockImports(query: GetStockImportsQueryDto) {
    throw new Error('Method not implemented.');
  }

  getStockImportDetail(stockImportId: string) {
    throw new Error('Method not implemented.');
  }
}

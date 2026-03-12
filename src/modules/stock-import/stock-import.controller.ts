import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateStockImportFromPurchaseOrderDto,
  GetStockImportsQueryDto,
} from './dto';
import { StockImportService } from './stock-import.service';

@ApiTags('stock-imports')
@Controller('stock-imports')
export class StockImportController {
  constructor(private readonly stockImportService: StockImportService) {}

  @Post('purchase-orders/:purchaseOrderId')
  createStockImportFromPurchaseOrder(
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: CreateStockImportFromPurchaseOrderDto,
  ) {
    throw new Error('Method not implemented.');
  }

  @Get()
  getStockImports(@Query() query: GetStockImportsQueryDto) {
    throw new Error('Method not implemented.');
  }

  @Get(':stockImportId')
  getStockImportDetail(@Param('stockImportId') stockImportId: string) {
    throw new Error('Method not implemented.');
  }
}

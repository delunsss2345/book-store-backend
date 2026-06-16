import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { GetStockImportsQueryDto, StockImportListResponseDto } from '../dto';
import { StockImportService } from '../service/stock-import.service';

@ApiTags('stock-imports')
@Controller('stock-imports')
export class StockImportController {
  constructor(private readonly stockImportService: StockImportService) {}

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: StockImportListResponseDto })
  getStockImports(@Query() query: GetStockImportsQueryDto) {
    return this.stockImportService.getStockImports(query);
  }
}

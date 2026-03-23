import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  GetStockImportItemsQueryDto,
  StockImportItemListResponseDto,
} from './dto';
import { StockImportItemService } from './stock-import-item.service';

@ApiTags('stock-import-items')
@Controller('stock-imports')
export class StockImportItemController {
  constructor(
    private readonly stockImportItemService: StockImportItemService,
  ) {}

  @Get(':stockImportId/items')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: StockImportItemListResponseDto })
  getStockImportItemsByStockImportId(
    @Param('stockImportId') stockImportId: string,
    @Query() query: GetStockImportItemsQueryDto,
    @GetLanguage() lang: string,
  ) {
    return this.stockImportItemService.getStockImportItemsByStockImportId(
      stockImportId,
      query,
      lang,
    );
  }
}

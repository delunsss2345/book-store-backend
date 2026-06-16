import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  GetStockImportItemsQueryDto,
  StockImportItemListResponseDto,
} from '../dto';
import { StockImportItemService } from '../service/stock-import-item.service';

@ApiTags('stock-import-items')
@Controller('stock-imports')
export class StockImportItemController {
  constructor(
    private readonly stockImportItemService: StockImportItemService,
  ) { }

  @Get(':stockImportId/items')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: StockImportItemListResponseDto })
  getStockImportItemsByStockImportId(
    @Param('stockImportId') stockImportId: string,
    @Query() query: GetStockImportItemsQueryDto,
    @GetLanguageId() langId: number,
  ) {
    return this.stockImportItemService.getStockImportItemsByStockImportId(
      stockImportId,
      query,
      langId,
    );
  }
}

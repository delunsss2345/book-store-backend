import { ResponsePaginationDto } from '@/common/pagination/response/response-pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { AdminStockImportItemResponseDto } from './admin-stock-import-item.response.dto';

export class AdminStockImportListResponseDto extends ResponsePaginationDto<AdminStockImportItemResponseDto> {
  @ApiProperty({ type: () => [AdminStockImportItemResponseDto] })
  declare items: AdminStockImportItemResponseDto[];
}

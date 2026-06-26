import { ApiProperty } from '@nestjs/swagger';
import { AdminStockImportItemResponseDto } from './admin-stock-import-item.response.dto';

export class AdminStockImportDetailItemResponseDto {
  @ApiProperty({ example: 'cm7xitem123' })
  id: string;

  @ApiProperty({ example: '1' })
  bookVariantId: string;

  @ApiProperty({ example: 12 })
  quantity: number;

  @ApiProperty({ example: 85000 })
  importPrice: number;
}

export class AdminStockImportDetailResponseDto extends AdminStockImportItemResponseDto {
  @ApiProperty({ type: () => [AdminStockImportDetailItemResponseDto] })
  items: AdminStockImportDetailItemResponseDto[];
}

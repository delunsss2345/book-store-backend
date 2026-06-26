import { ApiProperty } from '@nestjs/swagger';
import { AdminStockImportItemResponseDto } from './admin-stock-import-item.response.dto';

export class AdminStockImportDetailItemResponseDto {
  @ApiProperty({ example: 'cm7xitem123' })
  id: string;

  @ApiProperty({ example: 'cm7xpoitem456' })
  purchaseOrderItemId: string;

  @ApiProperty({ example: 12 })
  realQuantity: number;

  @ApiProperty({ example: 3 })
  lackQuantity: number;

  @ApiProperty({ example: 85000 })
  totalPrice: number;
}

export class AdminStockImportDetailResponseDto extends AdminStockImportItemResponseDto {
  @ApiProperty({ type: () => [AdminStockImportDetailItemResponseDto] })
  items: AdminStockImportDetailItemResponseDto[];
}

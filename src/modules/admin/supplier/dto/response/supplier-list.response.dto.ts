import { ApiProperty } from '@nestjs/swagger';
import { SupplierItemResponseDto } from './supplier-item.response.dto';

export class SupplierListResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 6 })
  totalPages: number;

  @ApiProperty({ type: () => [SupplierItemResponseDto] })
  items: SupplierItemResponseDto[];
}

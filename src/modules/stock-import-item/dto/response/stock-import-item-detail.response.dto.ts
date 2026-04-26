import { ApiProperty } from '@nestjs/swagger';

export class StockImportItemDetailResponseDto {
  @ApiProperty({ example: 'cm7xitem123' })
  id: string;

  @ApiProperty({ example: 'cm7ximport123' })
  stockImportId: string;

  @ApiProperty({ example: '1' })
  bookVariantId: string;

  @ApiProperty({ example: 12 })
  quantity: number;

  @ApiProperty({ example: 85000 })
  importPrice: number;

  @ApiProperty({
    example: 'Clean Code',
    nullable: true,
    required: false,
  })
  title: string | null;

  @ApiProperty({ example: 'PAPERBACK' })
  format: string;
}

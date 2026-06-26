import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminStockImportCreatorResponseDto {
  @ApiPropertyOptional({ example: 'Huy' })
  firstName: string | null;

  @ApiPropertyOptional({ example: 'Pham' })
  lastName: string | null;
}

export class AdminStockImportItemResponseDto {
  @ApiProperty({ example: 'cm7xabc123' })
  id: string;

  @ApiPropertyOptional({ example: 'cm7xpo123', nullable: true })
  purchaseOrderId: string | null;

  @ApiPropertyOptional({ example: 'Nha cung cap A', nullable: true })
  supplierName: string | null;

  @ApiPropertyOptional({ example: 'Nhap kho dot 1', nullable: true })
  note: string | null;

  @ApiProperty({ example: 120000 })
  totalAmount: number;

  @ApiPropertyOptional({
    type: () => AdminStockImportCreatorResponseDto,
    nullable: true,
  })
  creator: AdminStockImportCreatorResponseDto | null;

  @ApiProperty()
  createdAt: Date;
}

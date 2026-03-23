import { ApiProperty } from '@nestjs/swagger';

export class StockImportItemResponseDto {
  @ApiProperty({ example: 'cm7xabc123' })
  id: string;

  @ApiProperty({ example: 'cm7xpo123', nullable: true, required: false })
  purchaseOrderId: string | null;

  @ApiProperty({ example: '1' })
  supplierId: string;

  @ApiProperty({ example: 'Nha cung cap A', nullable: true, required: false })
  supplierName: string | null;

  @ApiProperty({ example: 'Nhap kho dot 1', nullable: true, required: false })
  note: string | null;

  @ApiProperty({ example: 120000 })
  totalAmount: number;

  @ApiProperty({ example: 10000 })
  taxAmount: number;

  @ApiProperty()
  createdAt: Date;
}

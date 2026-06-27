import { ApiProperty } from '@nestjs/swagger';

export class AdminBookPriceViewPurchaseOrderItemDto {
  @ApiProperty({ example: 'clxyz123' })
  id: string;
}

export class AdminBookPriceViewVariantDto {
  @ApiProperty({ example: '22' })
  id: string;

  @ApiProperty({ example: '149000' })
  price: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 10 })
  stock: number

  @ApiProperty({ example: '9494949491' })
  isbn: string

  @ApiProperty({ type: () => [AdminBookPriceViewPurchaseOrderItemDto] })
  purchaseOrderItem: AdminBookPriceViewPurchaseOrderItemDto[];
}

export class AdminBookPriceViewResponseDto {
  @ApiProperty({ example: '12' })
  id: string;

  @ApiProperty({ type: () => [AdminBookPriceViewVariantDto] })
  variants: AdminBookPriceViewVariantDto[];
}

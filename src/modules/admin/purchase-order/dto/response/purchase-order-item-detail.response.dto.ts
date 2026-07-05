import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseOrderItemDetailResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() purchaseOrderId: string;
  @ApiProperty() bookVariantId: number;
  @ApiProperty() quantity: number;
  @ApiProperty() unitPrice: number;
  @ApiProperty() discountPrice: number;
  @ApiProperty() price: number;
  @ApiProperty() totalPrice: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional({ nullable: true }) title: string | null;
  @ApiProperty() format: string;
}

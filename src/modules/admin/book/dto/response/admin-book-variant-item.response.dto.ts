import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminBookVariantPurchaseOrderItemResponseDto {
    @ApiProperty({ example: 'clxyz123' })
    id: string;

    @ApiProperty({ example: 'clpurchase456' })
    purchaseOrderId: string;

    @ApiProperty({ example: '120000.00' })
    unitPrice: string;

    @ApiProperty({ example: '10000.00' })
    discountPrice: string;

    @ApiProperty({ example: '110000.00' })
    price: string;
}

export class AdminBookVariantItemResponseDto {
    @ApiProperty({ example: '22' })
    id: string;

    @ApiProperty({ example: 'PAPERBACK' })
    format: string;

    @ApiPropertyOptional({ example: 1 })
    edition: number | null;

    @ApiPropertyOptional({ example: '9786041234567' })
    isbn: string | null;

    @ApiProperty({ example: '149000.00' })
    price: string;

    @ApiPropertyOptional({ example: 'VND' })
    currencyCode: string | null;

    @ApiPropertyOptional({ example: 10 })
    stock: number | null;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ type: () => [AdminBookVariantPurchaseOrderItemResponseDto] })
    purchaseOrderItem: AdminBookVariantPurchaseOrderItemResponseDto[];
}

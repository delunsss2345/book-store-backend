import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseOrderItemRequestDto {

    @ApiProperty({
        example: 1,
        description: 'ID của biến thể sách'
    })
    bookVariantId: bigint;

    @ApiProperty({
        example: 10,
        description: 'Số lượng'
    })
    quantity: number;

    @ApiProperty({
        example: 120000,
        description: 'Giá mỗi đơn vị'
    })
    unitPrice: number;

    @ApiProperty({
        example: 1200000,
        description: 'Tổng tiền'
    })
    totalPrice: number;
}

export class CreatePurchaseOrderRequestDto {

    @ApiProperty({
        example: 1,
        description: 'ID nhà cung cấp'
    })
    supplierId: bigint;

    @ApiProperty({
        type: [CreatePurchaseOrderItemRequestDto],
        description: 'Danh sách sản phẩm'
    })
    items: CreatePurchaseOrderItemRequestDto[];
}
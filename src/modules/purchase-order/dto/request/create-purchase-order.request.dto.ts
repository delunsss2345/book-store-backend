import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

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
        description: 'ID nhà cung cấp',
        type: Number
    })
    supplierId: number;

    @ApiProperty({
        example: 'PO-20260312-001',
        description: 'Mã đơn nhập'
    })
    code: string;

    @ApiProperty({
        example: '2026-03-12T10:00:00.000Z',
        description: 'Ngày tạo đơn',
        type: String,
        format: 'date-time'
    })
    createdAt: Date;

    @ApiProperty({
        example: 'Nhập hàng tháng 3',
        description: 'Ghi chú',
        required: false
    })
    note: string;

    @ApiProperty({
        example: 1500000,
        description: 'Tổng tiền trước thuế',
        type: Number
    })
    totalAmount: number;

    @ApiProperty({
        example: 150000,
        description: 'Tiền thuế',
        type: Number
    })
    @IsOptional()
    taxAmount?: number;

    @ApiProperty({
        type: [CreatePurchaseOrderItemRequestDto],
        description: 'Danh sách sản phẩm'
    })
    items: CreatePurchaseOrderItemRequestDto[];
}
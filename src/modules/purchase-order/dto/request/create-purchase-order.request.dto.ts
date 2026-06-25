import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsDateString,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

export class CreatePurchaseOrderItemRequestDto {
    @ApiProperty({
        example: 1,
        description: 'ID của đầu sách',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    bookVariantId: number;

    @ApiProperty({
        example: 10,
        description: 'Số lượng',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({
        example: 120000,
        description: 'Giá mỗi đơn vị chưa chiết khấu',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    unitPrice: number;

    @ApiProperty({
        example: 10.5,
        description: 'Chiết khấu nhập theo phần trăm',
        type: Number,
        format: 'float',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(100)
    discountPercent: number;

    @ApiProperty({
        example: 1200000,
        description: 'Tổng tiền',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    totalPrice: number;
}

export class CreatePurchaseOrderRequestDto {
    @ApiProperty({
        example: 1,
        description: 'ID nhà cung cấp',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    supplierId: number;

    @ApiProperty({
        example: 'PO-20260312-001',
        description: 'Mã đơn nhập',
    })
    @IsString()
    code: string;

    @ApiProperty({
        example: '2026-03-12',
        description: 'Ngày tạo đơn',
        type: String,
        format: 'date',
    })
    @IsDateString()
    createdAt: string;

    @ApiProperty({
        example: 'Nhập hàng tháng 3',
        description: 'Ghi chú',
        required: false,
    })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty({
        example: 1500000,
        description: 'Tổng tiền trước thuế',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    totalAmount: number;

    @ApiProperty({
        example: 150000,
        description: 'Tiền thuế',
        type: Number,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    taxAmount?: number;

    @ApiProperty({
        type: [CreatePurchaseOrderItemRequestDto],
        description: 'Danh sách sản phẩm',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseOrderItemRequestDto)
    items: CreatePurchaseOrderItemRequestDto[];
}
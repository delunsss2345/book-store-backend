import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from 'class-validator';

export class SePayHooksDto {
    @ApiProperty({ example: 123456, description: 'ID giao dịch trên SePay' })
    @Type(() => Number)
    @IsInt()
    id: number;

    @ApiProperty({ example: 'SEPAY', description: 'Tên gateway/nguồn giao dịch' })
    @IsString()
    @IsNotEmpty()
    gateway: string;

    @ApiProperty({
        example: '2026-02-20T10:15:30+07:00',
        description: 'Thời gian phát sinh giao dịch (chuỗi ISO hoặc theo format SePay trả về)',
    })
    @IsString()
    @IsNotEmpty()
    transactionDate: string;

    @ApiProperty({ example: '0123456789', description: 'Số tài khoản nhận/nguồn' })
    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @ApiProperty({ example: 'FT123ABC', description: 'Mã giao dịch / code' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        example: 'Thanh toan don hang #ORDER123',
        description: 'Nội dung chuyển khoản',
    })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        example: 'IN',
        description: 'Loại giao dịch: IN/OUT (tuỳ SePay quy ước)',
    })
    @IsString()
    @IsNotEmpty()
    transferType: string;

    @ApiProperty({
        example: 150000,
        description: 'Số tiền giao dịch',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    transferAmount: number;

    @ApiProperty({
        example: 2500000,
        description: 'Số dư tích luỹ / balance sau giao dịch (tuỳ SePay)',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    accumulated: number;

    @ApiProperty({
        example: 'SUB001',
        description: 'Sub account (nếu có)',
    })
    @IsString()
    @IsNotEmpty()
    subAccount: string;

    @ApiProperty({
        example: 'REF-ORDER123',
        description: 'Mã tham chiếu',
    })
    @IsString()
    @IsNotEmpty()
    referenceCode: string;

    @ApiProperty({
        example: 'Giao dich thanh cong',
        description: 'Mô tả ngắn',
    })
    @IsString()
    @IsNotEmpty()
    description: string;
}
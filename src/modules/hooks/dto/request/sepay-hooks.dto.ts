import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class SePayHooksDto {
    @ApiProperty({ example: 42958087, description: 'ID giao dịch trên SePay' })
    @Type(() => Number)
    @IsInt()
    id: number;

    // payload thực tế: 'MBBank' (không phải 'SEPAY')
    @ApiProperty({ example: 'MBBank', description: 'Tên gateway/nguồn giao dịch' })
    @IsString()
    @IsNotEmpty()
    gateway: string;

    // payload thực tế: '2026-02-21 22:07:00' (không phải ISO)
    @ApiProperty({
        example: '2026-02-21 22:07:00',
        description: 'Thời gian phát sinh giao dịch (format SePay trả về)',
    })
    @IsString()
    @IsNotEmpty()
    transactionDate: string;

    @ApiProperty({ example: '17979220797979', description: 'Số tài khoản nhận/nguồn' })
    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    // payload thực tế có thể null
    @ApiPropertyOptional({
        example: null,
        nullable: true,
        description: 'Mã giao dịch / code (có thể null)',
    })
    @IsOptional()
    @IsString()
    code?: string | null;

    @ApiProperty({ example: 'OD260221VILRVN', description: 'Nội dung chuyển khoản' })
    @IsString()
    @IsNotEmpty()
    content: string;

    // payload thực tế: 'in' (lowercase)
    @ApiProperty({
        example: 'in',
        description: 'Loại giao dịch: in/out (tuỳ SePay)',
    })
    @IsString()
    @IsNotEmpty()
    transferType: string;

    @ApiProperty({
        example: 192000,
        description: 'Số tiền giao dịch',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    transferAmount: number;

    // payload thực tế có thể âm
    @ApiProperty({
        example: -1604112,
        description: 'Số dư tích luỹ / balance sau giao dịch (tuỳ SePay)',
        type: Number,
    })
    @Type(() => Number)
    @IsNumber()
    accumulated: number;

    // payload thực tế có thể null
    @ApiPropertyOptional({
        example: null,
        nullable: true,
        description: 'Sub account (có thể null)',
    })
    @IsOptional()
    @IsString()
    subAccount?: string | null;

    // payload thực tế: 'FT26054023300626'
    @ApiProperty({ example: 'FT26054023300626', description: 'Mã tham chiếu' })
    @IsString()
    @IsNotEmpty()
    referenceCode: string;

    @ApiProperty({
        example: 'BankAPINotify OD260221VILRVN',
        description: 'Mô tả ngắn',
    })
    @IsString()
    @IsNotEmpty()
    description: string;
}
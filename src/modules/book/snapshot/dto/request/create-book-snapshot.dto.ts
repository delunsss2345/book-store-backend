import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookFormat } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';


export class CreateBookSnapshotDto {
    @ApiProperty({
        description: 'ID của book variant (number). Nên gửi dạng string để tránh mất chính xác.',
        example: '1234567890123456789',
        type: String,
    })
    @IsNotEmpty()
    @IsString()
    bookVariantId: string;

    @ApiPropertyOptional({
        description: 'Hash nội dung',
        example: 'b1946ac92492d2347c6235b4d2611184',
        maxLength: 255,
    })

    @IsOptional()
    @IsString()
    @MaxLength(255)
    contentHash?: string;

    @ApiPropertyOptional({
        description: 'URL ảnh bìa snapshot',
        example: 'https://cdn.example.com/covers/abc.jpg',
    })
    @IsOptional()
    @IsString()
    coverImageUrlSnapshot?: string;

    @ApiPropertyOptional({
        description: 'Tiêu đề snapshot',
        example: 'Clean Code',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    titleSnapshot?: string;

    @ApiProperty({
        description: 'SKU snapshot',
        example: 'SKU-CC-001',
        maxLength: 50,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    skuSnapshot: string;

    @ApiProperty({
        description: 'Giá snapshot (Decimal 12,2). Có thể gửi number hoặc string tuỳ bạn validate.',
        example: '199000.00',
        type: String,
    })
    @Type(() => Number)
    @IsNumber()
    priceSnapshot: number;

    @ApiPropertyOptional({
        description: 'Mã tiền tệ (ISO 4217)',
        example: 'VND',
        maxLength: 3,
    })
    @IsOptional()
    @IsString()
    @MaxLength(3)
    currencyCodeSnapshot?: string;

    @ApiProperty({
        description: 'Định dạng sách snapshot',
        enum: BookFormat,
        example: BookFormat.PAPERBACK,
    })
    @IsNotEmpty()
    @IsEnum(BookFormat)
    formatSnapshot: BookFormat;

    @ApiPropertyOptional({
        description: 'Lần tái bản / edition snapshot',
        example: 2,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    editionSnapshot?: number;

    @ApiPropertyOptional({
        description: 'ISBN snapshot',
        example: '9780132350884',
        maxLength: 20,
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    isbnSnapshot?: string;
}
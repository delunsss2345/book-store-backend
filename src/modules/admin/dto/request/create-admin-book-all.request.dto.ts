import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookFormat } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min
} from 'class-validator';



export class CreateBookSpecDto {
    @ApiPropertyOptional({ example: 14.0, description: 'Chiều rộng (cm)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    widthCm?: number;

    @ApiPropertyOptional({ example: 20.5, description: 'Chiều cao (cm)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    heightCm?: number;

    @ApiPropertyOptional({ example: 2.4, description: 'Độ dày (cm)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    thicknessCm?: number;

    @ApiPropertyOptional({ example: 'Bọc màng co', maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    packaging?: string;
}

export class CreateBookTranslationDto {
    @ApiProperty({ example: 1, description: 'languageId (ví dụ vi, en)' })
    @IsString()
    @IsOptional()
    languageCode?: string;

    @ApiProperty({ example: 'Dế Mèn Phiêu Lưu Ký', maxLength: 500 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    title!: string;

    @ApiPropertyOptional({ example: 'Một tác phẩm thiếu nhi kinh điển...' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'de-men-phieu-luu-ky', maxLength: 500 })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    slug?: string;
}

export class CreateBookAuthorDto {
    @ApiProperty({ example: 'Tô Hoài', description: 'Tên tác giả' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    authorName!: string;

    @ApiPropertyOptional({ example: true, default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isPrimary?: boolean;
}

export class CreateCategoriesDto {
    categoryId: number
}

export class CreateBookVariantAndSupplierImportDto {
    @ApiProperty({ enum: BookFormat, example: BookFormat.PAPERBACK })
    @IsEnum(BookFormat)
    format!: BookFormat;

    @ApiPropertyOptional({ example: '9786040000001', maxLength: 20 })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    isbn: string;

    @ApiProperty({ example: 79000, description: 'Giá bán' })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price!: number;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ example: 0, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    stock: number
}

export class CreateBookVariantDto {
    @ApiProperty({ enum: BookFormat, example: BookFormat.PAPERBACK })
    @IsEnum(BookFormat)
    format: BookFormat;

    @ApiPropertyOptional({ example: '9786040000001', maxLength: 20 })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    isbn: string;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ example: 1900 })
    @Type(() => Number)
    @IsInt()
    @Min(1900)
    publicationYear: number;
}

export class CreateBookVariantItemDto {
    @ApiProperty({ enum: BookFormat, example: BookFormat.PAPERBACK })
    @IsEnum(BookFormat)
    format: BookFormat;

    @ApiProperty({ example: '9786041234567', maxLength: 20 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    isbn: string;

    @ApiProperty({ example: 1900 })
    @Type(() => Number)
    @IsInt()
    @Min(1900)
    publicationYear: number;

    @ApiProperty({ example: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    edition: number;
}


import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Badge, BookFormat } from '@prisma/client';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    MaxLength,
    Min,
    ValidateNested,
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
    @ApiProperty({ example: 1, description: 'languageId (ví dụ 1=vi, 2=en)' })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    languageId!: number;

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
    @ApiProperty({ example: '12', description: 'authorId (BigInt -> string)' })
    @IsString()
    @IsNotEmpty()
    authorId!: string;

    @ApiPropertyOptional({ example: true, default: false })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isPrimary?: boolean;
}

export class CreateBookVariantDto {
    @ApiProperty({ enum: BookFormat, example: BookFormat.PAPERBACK })
    @IsEnum(BookFormat)
    format!: BookFormat;

    @ApiPropertyOptional({ example: 1, description: 'Edition, có thể null' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    edition?: number;

    @ApiPropertyOptional({ example: '9786040000001', maxLength: 20 })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    isbn?: string;

    @ApiProperty({ example: 45000, description: 'Giá nhập. Dùng number ở API, convert sang Decimal ở service' })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    costPrice!: number;

    @ApiProperty({ example: 79000, description: 'Giá bán' })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price!: number;

    @ApiPropertyOptional({ example: 'VND', maxLength: 3 })
    @IsOptional()
    @IsString()
    @MaxLength(3)
    currencyCode?: string;

    @ApiPropertyOptional({ example: 120, description: 'Tồn kho ban đầu' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    stock?: number;

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}

export class CreateAdminBookAllRequestDto {
    // Publisher
    @ApiPropertyOptional({ example: '1', description: 'publisherId (BigInt -> string)' })
    @IsOptional()
    @IsString()
    publisherId?: string;

    // Các thông tin “spec-like” bạn đang để ở Book level
    @ApiPropertyOptional({ example: 2026 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(9999)
    publicationYear?: number;

    @ApiPropertyOptional({ example: 320 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageCount?: number;

    @ApiPropertyOptional({ example: 420 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    weightGrams?: number;

    @ApiPropertyOptional({
        example: 'https://cdn.example.com/covers/sample-book.jpg',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    @IsUrl({ require_protocol: true }, { message: 'coverImageUrl phải là URL hợp lệ (có http/https)' })
    coverImageUrl?: string;

    // Badge (book_badges)
    @ApiPropertyOptional({ enum: Badge, example: Badge.NEW })
    @IsOptional()
    @IsEnum(Badge)
    badgeCode?: Badge;

    // Specs (book_specs)
    @ApiPropertyOptional({ type: () => CreateBookSpecDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => CreateBookSpecDto)
    spec?: CreateBookSpecDto;

    // Translations (book_translations)
    @ApiProperty({
        type: () => [CreateBookTranslationDto],
        description: 'Ít nhất 1 bản dịch (vi/en...)',
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateBookTranslationDto)
    translations!: CreateBookTranslationDto[];

    // Authors (book_authors)
    @ApiPropertyOptional({
        type: () => [CreateBookAuthorDto],
        description: 'Có thể truyền nhiều tác giả; isPrimary=true cho tác giả chính',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateBookAuthorDto)
    authors?: CreateBookAuthorDto[];

    // Variants (book_variants)
    @ApiProperty({
        type: () => [CreateBookVariantDto],
        description: 'Ít nhất 1 variant; unique theo (bookId, format, edition)',
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateBookVariantDto)
    variants!: CreateBookVariantDto[];
}



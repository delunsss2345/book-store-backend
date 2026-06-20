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

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

}

export class CreateAdminBookAllRequestDto {
    // Publisher
    @ApiProperty({ example: 'NXB Kim Đồng', description: 'Tên nhà xuất bản' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    publisherName!: string;

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
        type: () => [CreateBookVariantAndSupplierImportDto],
        description: 'Ít nhất 1 variant; unique theo (bookId, format, edition)',
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateBookVariantAndSupplierImportDto)
    variants!: CreateBookVariantAndSupplierImportDto[];


    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateCategoriesDto)
    categories!: CreateCategoriesDto[]

    supplierId: number
}



import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

export class QuickBookSpecResponseDto {
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

export class QuickBookFillResponseDto {
    @ApiProperty({ example: 'Clean Code', maxLength: 500 })
    @IsString()
    @MaxLength(500)
    title!: string;

    @ApiProperty({
        example:
            'Một cuốn sách kinh điển về kỹ nghệ phần mềm, tập trung vào nguyên tắc viết mã dễ đọc, dễ bảo trì và thực hành tốt trong dự án thực tế.',
    })
    @IsString()
    description!: string;

    @ApiPropertyOptional({ example: 'Robert C. Martin', maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    authorName?: string;

    @ApiPropertyOptional({ example: 'Prentice Hall', maxLength: 200 })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    publisherName?: string;

    @ApiPropertyOptional({ example: 2008 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(9999)
    publicationYear?: number;

    @ApiPropertyOptional({ example: 464 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageCount?: number;

    @ApiPropertyOptional({ example: 650, description: 'Khối lượng (grams)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    weightGrams?: number;

    @ApiPropertyOptional({
        example: 'https://covers.openlibrary.org/b/id/123456-L.jpg',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    @IsUrl({ require_protocol: true })
    coverImageUrl?: string;

    @ApiPropertyOptional({ type: () => QuickBookSpecResponseDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => QuickBookSpecResponseDto)
    spec?: QuickBookSpecResponseDto;
}
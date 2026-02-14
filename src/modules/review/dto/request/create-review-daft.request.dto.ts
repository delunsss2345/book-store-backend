import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDraftRequestDto {
    @ApiProperty({ example: 1, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    bookId: number;

    @ApiProperty({ example: 10, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    bookVariantId: number;

    @ApiProperty({ example: 'san pham te', maxLength: 500 })
    @IsString()
    @MaxLength(500)
    userHint: string;

    @ApiPropertyOptional({ example: 'critical_polite', description: 'Ví dụ: neutral | friendly | critical_polite' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    tone?: string;

    @ApiPropertyOptional({ example: 'vi', default: 'vi' })
    @IsOptional()
    @IsIn(['vi', 'en'])
    language?: 'vi' | 'en' = 'vi';

    @ApiPropertyOptional({ example: 100, default: 100, minimum: 30, maximum: 500 })
    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(30)
    @Max(500)
    targetWords?: number = 100;
}

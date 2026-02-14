import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewRequestDto {
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

    @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ example: 'Sach hay, rat dang mua.' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    content?: string;
}



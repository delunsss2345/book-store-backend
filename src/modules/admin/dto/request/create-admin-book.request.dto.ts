import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAdminBookRequestDto {
    @ApiPropertyOptional({ example: '1' })
    @IsOptional()
    @IsString()
    publisherId?: string;

    @ApiPropertyOptional({ example: 2026 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
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
        maxLength: 1000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    coverImageUrl?: string;
}

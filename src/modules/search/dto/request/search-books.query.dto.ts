import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min
} from 'class-validator';

export class SearchBooksQueryDto {
    @ApiProperty({ example: 'sach lap trinh backend' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty()
    q: string;

    @ApiPropertyOptional({ example: 'vi', default: 'vi', enum: ['vi', 'en'] })
    @IsOptional()
    @IsIn(['vi', 'en'])
    lang?: string;

    @ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number;


    @ApiPropertyOptional({ example: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    page?: number;

}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum CatalogBookSort {
    NEWEST = 'newest',
    PRICE_ASC = 'price_asc',
    PRICE_DESC = 'price_desc',
    TOP_RATED = 'top_rated',
    BEST_SELLER = 'best_seller',
}

export class CatalogBookListQueryDto {
    @ApiPropertyOptional({ example: 'en', default: 'en', enum: ['vi', 'en'] })
    @IsOptional()
    @IsIn(['vi', 'en'])
    lang?: string;

    @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}

import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export enum CatalogBookSort {
    NEWEST = 'newest',
    PRICE_ASC = 'price_asc',
    PRICE_DESC = 'price_desc',
    TOP_RATED = 'top_rated',
    BEST_SELLER = 'best_seller',
}

export class CatalogBookListQueryDto extends BasePaginationDto {
    @ApiPropertyOptional({ example: 'programming' })
    @IsOptional()
    @IsString()
    @Type(() => String)
    slugCategory?: string;


    @ApiPropertyOptional({ example: 'The book' })
    @IsOptional()
    @IsString()
    @Type(() => String)
    keyword?: string;
}

import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SearchFilterSortType {
    ALL = 'all',
    PRICE_LOW_TO_HIGH = 'price-low-to-high',
    PRICE_HIGH_TO_LOW = 'price-high-to-low',
    TITLE_A_Z = 'title-a-z',
    TITLE_Z_A = 'title-z-a',
}
export enum SearchPriceType {
    ALL = 'all',
    UNDER_100 = 'u100',
    BETWEEN_100_300 = 'bw100-300',
    OVER_300 = 'over-300',
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

    @ApiPropertyOptional({
        enum: SearchFilterSortType,
        example: SearchFilterSortType.PRICE_HIGH_TO_LOW,
    })
    @IsOptional()
    @IsEnum(SearchFilterSortType)
    typeSort?: SearchFilterSortType;

    @ApiPropertyOptional({
        enum: SearchPriceType,
        example: SearchPriceType.ALL,
    })
    @IsOptional()
    @IsEnum(SearchPriceType)
    priceType?: SearchPriceType;
}

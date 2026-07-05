import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum SearchFilterSortType {
    BEST_SELLING_TITLES = 'best-selling-titles',
    PRICE_LOW_TO_HIGH = 'price-low-to-high',
    PRICE_HIGH_TO_LOW = 'price-high-to-low',
    TITLE_A_Z = 'title-a-z',
    TITLE_Z_A = 'title-z-a',
}

const toQueryParts = ({ value }: { value: unknown }) => {
    if (value == null || value === '') return undefined;
    const raw = Array.isArray(value) ? value : [value];
    const parts = raw
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);

    return parts.length ? parts : undefined;
};

export class SearchFilterQueryDto extends BasePaginationDto {
    @ApiPropertyOptional({
        example: '1,2,3',
        description: 'Category ids, comma separated or repeated query params',
    })
    @IsOptional()
    @Transform(toQueryParts)
    @IsArray()
    @IsString({ each: true })
    categories?: string[];

    @ApiPropertyOptional({
        example: '10000-50000',
        description: 'Price range. Supports min-max or min,max',
    })
    @IsOptional()
    @Transform(toQueryParts)
    @IsArray()
    @IsString({ each: true })
    prices?: string[];

    @ApiPropertyOptional({
        enum: SearchFilterSortType,
        example: SearchFilterSortType.PRICE_LOW_TO_HIGH,
    })
    @IsOptional()
    @IsEnum(SearchFilterSortType)
    type?: SearchFilterSortType;
}

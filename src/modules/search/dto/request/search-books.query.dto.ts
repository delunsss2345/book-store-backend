import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { SearchFilterSortType } from '@/modules/search/dto/request/search-filter.query.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString
} from 'class-validator';

export enum SearchPriceType {
    ALL = 'all',
    UNDER_100 = 'u100',
    BETWEEN_100_300 = 'bw100-300',
    OVER_300 = 'over-300',
}

export class SearchBooksQueryDto extends BasePaginationDto {
    @ApiProperty({ example: 'sach lap trinh backend' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString()
    @IsNotEmpty()
    q: string;

    @ApiPropertyOptional({
        enum: SearchFilterSortType,
        example: SearchFilterSortType.PRICE_LOW_TO_HIGH,
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

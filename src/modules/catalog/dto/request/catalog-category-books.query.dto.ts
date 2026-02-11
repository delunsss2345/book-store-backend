import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CatalogBookSort } from './catalog-book-list.query.dto';

export class CatalogCategoryBooksQueryDto {
    @ApiPropertyOptional({ example: 'vi', default: 'vi' })
    @IsOptional()
    @IsString()
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

    @ApiPropertyOptional({ enum: CatalogBookSort, default: CatalogBookSort.NEWEST })
    @IsOptional()
    @IsEnum(CatalogBookSort)
    sort?: CatalogBookSort;
}

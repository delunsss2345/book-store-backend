import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CatalogBookSort } from './catalog-book-list.query.dto';

export class CatalogCategoryBooksQueryDto extends BasePaginationDto {
    @ApiPropertyOptional({ enum: CatalogBookSort, default: CatalogBookSort.NEWEST })
    @IsOptional()
    @IsEnum(CatalogBookSort)
    sort?: CatalogBookSort;
}

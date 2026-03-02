import { BasePaginationDto } from '@/common/dto/base-pagination.dto';

export enum CatalogBookSort {
    NEWEST = 'newest',
    PRICE_ASC = 'price_asc',
    PRICE_DESC = 'price_desc',
    TOP_RATED = 'top_rated',
    BEST_SELLER = 'best_seller',
}

export class CatalogBookListQueryDto extends BasePaginationDto { }

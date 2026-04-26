import { ResponsePaginationDto } from '@/common/pagination/response/response-pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import { CatalogBookCardDto } from './catalog-book-card.dto';

export class CatalogHomeResponseDto {
    @ApiProperty({ type: () => [CatalogBookCardDto] })
    newArrivals: CatalogBookCardDto[];

    @ApiProperty({ type: () => [CatalogBookCardDto] })
    bestSeller: CatalogBookCardDto[];

    @ApiProperty({ type: () => [CatalogBookCardDto] })
    topRated: CatalogBookCardDto[];

    @ApiProperty({ type: () => [CatalogBookCardDto] })
    recommend: CatalogBookCardDto[];

    @ApiProperty({ type: Date })
    generatedAt: Date;
}

export class CatalogRecommendRequestDto {
    @ApiProperty({ type: () => [CatalogBookCardDto] })
    recommend: CatalogBookCardDto[];
    @ApiProperty({ type: Date })
    generatedAt: Date;
}

export class CatalogBookListResponseDto extends ResponsePaginationDto<CatalogBookCardDto> {
    @ApiProperty({ type: () => [CatalogBookCardDto] })
    declare items: CatalogBookCardDto[];
}

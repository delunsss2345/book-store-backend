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

export class CatalogBookListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 120 })
    total: number;

    @ApiProperty({ example: 6 })
    totalPages: number;

    @ApiProperty({ type: () => [CatalogBookCardDto] })
    items: CatalogBookCardDto[];
}

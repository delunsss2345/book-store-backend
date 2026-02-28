import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Badge } from '@prisma/client';
import { CatalogBookCardDto, CatalogBookVariantDto, CatalogCategoryDto } from './catalog-book-card.dto';

export class CatalogBookSpecDto {
    @ApiPropertyOptional({ example: '14.50' })
    widthCm?: string | null;

    @ApiPropertyOptional({ example: '21.00' })
    heightCm?: string | null;

    @ApiPropertyOptional({ example: '2.30' })
    thicknessCm?: string | null;

    @ApiPropertyOptional({ example: 'MANG_CO' })
    packaging?: string | null;
}

export class CatalogBookDetailDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiProperty({ example: 'Designing Data-Intensive Applications' })
    title: string;

    @ApiPropertyOptional({ example: 'designing-data-intensive-applications' })
    slug?: string | null;

    @ApiPropertyOptional({ example: 'Deep dive into distributed systems.' })
    description?: string | null;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/books/ddia.jpg' })
    coverImageUrl?: string | null;

    @ApiPropertyOptional({ example: 2017 })
    publicationYear?: number | null;

    @ApiPropertyOptional({ example: 616 })
    pageCount?: number | null;

    @ApiPropertyOptional({ example: 900 })
    weightGrams?: number | null;

    @ApiPropertyOptional({ example: 'O\'Reilly' })
    publisherName?: string | null;

    @ApiPropertyOptional({ example: 4.7 })
    ratingAvg?: number | null;

    @ApiPropertyOptional({ example: 120 })
    ratingCount?: number;

    @ApiPropertyOptional({ example: 530 })
    soldCount?: number;

    @ApiProperty({ type: () => [CatalogCategoryDto] })
    categories: CatalogCategoryDto[];

    @ApiProperty({ type: () => [CatalogBookVariantDto] })
    variants: CatalogBookVariantDto[];

    @ApiProperty({ type: () => CatalogBookSpecDto })
    specs: CatalogBookSpecDto;

    @ApiProperty({ enum: Badge, isArray: true, example: [Badge.NEW, Badge.BESTSELLER] })
    badges: Badge[];

    @ApiProperty({ type: Date })
    createdAt: Date;

    @ApiPropertyOptional({ type: () => [CatalogBookCardDto] })
    recommend?: CatalogBookCardDto[];
}

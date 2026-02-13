import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CatalogBookVariantDto, CatalogCategoryDto } from './catalog-book-card.dto';

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

    @ApiProperty({ type: Date })
    createdAt: Date;
}

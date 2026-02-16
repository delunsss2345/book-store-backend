import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Badge } from '@prisma/client';

export class CatalogBookCardDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiProperty({ example: 'Designing Data-Intensive Applications' })
    title: string;

    @ApiPropertyOptional({ example: 'designing-data-intensive-applications' })
    slug?: string | null;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/books/ddia.jpg' })
    coverImageUrl?: string | null;

    @ApiPropertyOptional({ example: '10.00' })
    minPrice?: string | null;

    @ApiPropertyOptional({ example: '20.00' })
    maxPrice?: string | null;

    @ApiPropertyOptional({ example: 'USD' })
    currencyCode?: string | null;

    @ApiPropertyOptional({ example: 4.7 })
    ratingAvg?: number | null;

    @ApiPropertyOptional({ example: 120 })
    ratingCount?: number;

    @ApiPropertyOptional({ example: 530 })
    soldCount?: number;

    @ApiPropertyOptional({ example: false })
    isOutOfStock?: boolean;

    @ApiProperty()
    badges?: Badge[]

    @ApiProperty({ type: Date })
    createdAt: Date;
}

export class CatalogCategoryDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiPropertyOptional({ example: null })
    parentId?: string | null;

    @ApiProperty({ example: 'Backend' })
    name: string;

    @ApiPropertyOptional({ example: 'backend' })
    slug?: string | null;

    @ApiProperty({ example: 0 })
    sortOrder: number;
}

export class CatalogCategoryTreeDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiPropertyOptional({ example: null })
    parentId?: string | null;

    @ApiProperty({ example: 'Programming' })
    name: string;

    @ApiPropertyOptional({ example: 'programming' })
    slug?: string | null;

    @ApiProperty({ example: 1 })
    sortOrder: number;

    @ApiProperty({ type: () => [CatalogCategoryTreeDto] })
    children: CatalogCategoryTreeDto[];
}

export class CatalogBookVariantDto {
    @ApiProperty({ example: '10' })
    id: string;

    @ApiProperty({ example: 'PAPERBACK' })
    format: string;

    @ApiPropertyOptional({ example: 1 })
    edition?: number | null;

    @ApiPropertyOptional({ example: '9780134190440' })
    isbn?: string | null;

    @ApiProperty({ example: '15.99' })
    price: string;

    @ApiPropertyOptional({ example: 'USD' })
    currencyCode?: string | null;

    @ApiPropertyOptional({ example: 80 })
    stock?: number | null;
}

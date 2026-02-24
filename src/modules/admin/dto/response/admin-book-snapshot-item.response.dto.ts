import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminBookSnapshotItemResponseDto {
    @ApiProperty({ example: '3' })
    id: string;

    @ApiProperty({ example: '18' })
    bookVariantId: string;

    @ApiProperty({ example: '11' })
    bookId: string;

    @ApiPropertyOptional({ example: 'Dữ liệu lớn cho backend hiện đại' })
    titleSnapshot: string | null;

    @ApiProperty({ example: 'DUL-PB-0022-VN' })
    skuSnapshot: string;

    @ApiProperty({ example: '149000.00' })
    priceSnapshot: string;

    @ApiPropertyOptional({ example: 'VND' })
    currencyCodeSnapshot: string | null;

    @ApiProperty({ example: 'PAPERBACK' })
    formatSnapshot: string;

    @ApiPropertyOptional({ example: 1 })
    editionSnapshot: number | null;

    @ApiPropertyOptional({ example: '9786041234567' })
    isbnSnapshot: string | null;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/covers/sample-book.jpg' })
    coverImageUrlSnapshot: string | null;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    createdAt: Date;
}

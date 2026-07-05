import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminOrderDetailLineResponseDto {
    @ApiProperty({ example: '390' })
    id: string;

    @ApiProperty({ example: '88' })
    bookVariantSnapshotId: string;

    @ApiProperty({ example: 2 })
    quantity: number;

    @ApiProperty({ example: '149000.00' })
    unitPrice: string;

    @ApiProperty({ example: '298000.00' })
    lineTotal: string;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    createdAt: Date;

    @ApiPropertyOptional({ example: 'Dữ liệu lớn cho backend hiện đại' })
    titleSnapshot: string | null;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/covers/sample-book.jpg' })
    coverImageUrlSnapshot: string | null;

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
}

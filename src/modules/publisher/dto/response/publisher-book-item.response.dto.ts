import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublisherBookItemResponseDto {
    @ApiProperty({ example: '1' })
    bookId: string;

    @ApiProperty({ example: 'Lap trinh backend 001' })
    title: string;

    @ApiPropertyOptional({ example: 'seed-book-001' })
    slug?: string | null;

    @ApiPropertyOptional({ example: '120000.00' })
    minPrice?: string | null;

    @ApiPropertyOptional({ example: 'https://picsum.photos/seed/book-001/640/960' })
    coverImageUrl?: string | null;
}

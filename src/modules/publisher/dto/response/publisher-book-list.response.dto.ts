import { ApiProperty } from '@nestjs/swagger';
import { PublisherBookItemResponseDto } from './publisher-book-item.response.dto';

export class PublisherBookListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 120 })
    total: number;

    @ApiProperty({ example: 6 })
    totalPages: number;

    @ApiProperty({ type: () => [PublisherBookItemResponseDto] })
    items: PublisherBookItemResponseDto[];
}

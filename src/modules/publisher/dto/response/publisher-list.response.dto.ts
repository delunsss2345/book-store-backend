import { ApiProperty } from '@nestjs/swagger';
import { PublisherItemResponseDto } from './publisher-item.response.dto';

export class PublisherListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 120 })
    total: number;

    @ApiProperty({ example: 6 })
    totalPages: number;

    @ApiProperty({ type: () => [PublisherItemResponseDto] })
    items: PublisherItemResponseDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { ReviewItemResponseDto } from './review-item.response.dto';

export class ReviewListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 120 })
    total: number;

    @ApiProperty({ example: 6 })
    totalPages: number;

    @ApiProperty({ type: () => [ReviewItemResponseDto] })
    items: ReviewItemResponseDto[];
}

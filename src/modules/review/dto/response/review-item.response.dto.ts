import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewVariantResponseDto {
    @ApiProperty({ example: '10' })
    id: string;

    @ApiProperty({ example: 'PAPERBACK' })
    format: string;
}

export class ReviewItemResponseDto {
    @ApiProperty({ example: '1' })
    reviewId: string;

    @ApiProperty({ example: '1' })
    userId: string;

    @ApiProperty({ example: 5 })
    rating: number;

    @ApiPropertyOptional({ example: 'Hay va de hieu' })
    content?: string | null;

    @ApiProperty({ type: Date })
    createdAt: Date;

    @ApiProperty({ type: () => ReviewVariantResponseDto })
    variant: ReviewVariantResponseDto;
}

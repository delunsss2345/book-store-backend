import { ApiProperty } from '@nestjs/swagger';
import { CategoryItemResponseDto } from './category-item.response.dto';

export class CategoryListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 120 })
    total: number;

    @ApiProperty({ example: 6 })
    totalPages: number;

    @ApiProperty({ type: () => [CategoryItemResponseDto] })
    items: CategoryItemResponseDto[];
}

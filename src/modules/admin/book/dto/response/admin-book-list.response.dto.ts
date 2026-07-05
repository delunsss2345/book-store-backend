import { ApiProperty } from '@nestjs/swagger';
import { AdminBookListItemResponseDto } from './admin-book-list-item.response.dto';

export class AdminBookListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 5 })
    totalPages: number;

    @ApiProperty({ type: () => [AdminBookListItemResponseDto] })
    items: AdminBookListItemResponseDto[];
}

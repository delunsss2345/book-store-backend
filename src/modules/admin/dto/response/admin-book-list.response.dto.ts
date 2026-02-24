import { ApiProperty } from '@nestjs/swagger';
import { AdminBookItemResponseDto } from './admin-book-item.response.dto';

export class AdminBookListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 5 })
    totalPages: number;

    @ApiProperty({ type: () => [AdminBookItemResponseDto] })
    items: AdminBookItemResponseDto[];
}

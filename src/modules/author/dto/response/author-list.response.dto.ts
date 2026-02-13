import { ApiProperty } from '@nestjs/swagger';
import { AuthorItemResponseDto } from './author-item.response.dto';

export class AuthorListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 120 })
    total: number;

    @ApiProperty({ example: 6 })
    totalPages: number;

    @ApiProperty({ type: () => [AuthorItemResponseDto] })
    items: AuthorItemResponseDto[];
}

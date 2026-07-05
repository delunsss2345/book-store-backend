import { ApiProperty } from '@nestjs/swagger';
import { AdminUserItemResponseDto } from './admin-user-item.response.dto';

export class AdminUserListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 5 })
    totalPages: number;

    @ApiProperty({ type: () => [AdminUserItemResponseDto] })
    items: AdminUserItemResponseDto[];
}

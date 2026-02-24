import { ApiProperty } from '@nestjs/swagger';
import { AdminOrderItemResponseDto } from './admin-order-item.response.dto';

export class AdminOrderListResponseDto {
    @ApiProperty({ example: 1 })
    page: number;

    @ApiProperty({ example: 20 })
    limit: number;

    @ApiProperty({ example: 100 })
    total: number;

    @ApiProperty({ example: 5 })
    totalPages: number;

    @ApiProperty({ type: () => [AdminOrderItemResponseDto] })
    items: AdminOrderItemResponseDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { AdminOrderDetailLineResponseDto } from './admin-order-detail-line.response.dto';
import { AdminOrderItemResponseDto } from './admin-order-item.response.dto';

export class AdminOrderDetailResponseDto extends AdminOrderItemResponseDto {
    @ApiProperty({ type: () => [AdminOrderDetailLineResponseDto] })
    items: AdminOrderDetailLineResponseDto[];
}

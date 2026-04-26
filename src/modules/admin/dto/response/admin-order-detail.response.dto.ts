import { ApiProperty } from '@nestjs/swagger';
import { AdminOrderDetailLineResponseDto } from './admin-order-detail-line.response.dto';

export class AdminOrderDetailResponseDto {
    @ApiProperty({ type: () => [AdminOrderDetailLineResponseDto] })
    items: AdminOrderDetailLineResponseDto[];
}

import { ApiProperty } from '@nestjs/swagger';

export class AdminOrderStatusResponseDto {
  @ApiProperty({ example: 'Cập nhật trạng thái đơn hàng thành công' })
  message: string;
}

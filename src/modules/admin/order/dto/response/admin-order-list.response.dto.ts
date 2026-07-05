import { ResponsePaginationDto } from '@/common/pagination/response/response-pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  AdminGuestOrderItemResponseDto,
  AdminUserOrderItemResponseDto,
} from './admin-order-item.response.dto';

export class AdminGuestOrderListResponseDto extends ResponsePaginationDto<AdminGuestOrderItemResponseDto> {
  @ApiProperty({ type: () => [AdminGuestOrderItemResponseDto] })
  declare items: AdminGuestOrderItemResponseDto[];
}

export class AdminUserOrderListResponseDto extends ResponsePaginationDto<AdminUserOrderItemResponseDto> {
  @ApiProperty({ type: () => [AdminUserOrderItemResponseDto] })
  declare items: AdminUserOrderItemResponseDto[];
}

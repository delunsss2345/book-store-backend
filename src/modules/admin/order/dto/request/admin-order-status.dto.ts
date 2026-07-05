import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

const ADMIN_ORDER_STATUS_VALUES = [
  OrderStatus.CONFIRMED,
  OrderStatus.CANCELLED,
] as const;

export class AdminOrderStatusDto {
  @ApiProperty({
    description: 'Order status',
    enum: ADMIN_ORDER_STATUS_VALUES,
    example: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus)
  @IsIn(ADMIN_ORDER_STATUS_VALUES)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'Khách yêu cầu hủy đơn' })
  @IsOptional()
  @IsString()
  note?: string;
}

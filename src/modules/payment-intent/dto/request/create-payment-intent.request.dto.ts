import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentGateway, PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentIntentRequestDto {
  @ApiProperty({
    type: 'string',
    description: 'ID cua don hang',
    example: '123456789012345678',
  })
  @IsNotEmpty()
  orderId: bigint;

  @ApiProperty({
    enum: PaymentGateway,
    example: PaymentGateway.SEPAY,
  })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @ApiProperty({
    type: String,
    description: 'Ma don hang',
    example: 'ORD-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  orderCode: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({
    type: String,
    description: 'URL để redirect người dùng đến trang thanh toán của cổng thanh toán',
    example: 'https://payment-gateway.com/pay/123456',
  })
  @IsString()
  paymentUrl: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Mã hash của URL thanh toán trả về từ cổng thanh toán',
    example: 'sdadadwqweqwe123123123123',
  })
  @IsOptional()
  @IsString()
  tokenUrl: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Nội dung chuyển khoản để đối soát webhook',
    example: 'taschen A1b2C3d4',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    type: Date,
    description: 'Thoi gian het han cua payment intent',
    example: '2026-04-17T12:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiredAt?: Date;
}

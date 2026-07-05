import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentGateway, PaymentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentIntentRequestDto {
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
}

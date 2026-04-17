import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { PaymentGateway, PaymentStatus } from '@prisma/client';

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

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

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

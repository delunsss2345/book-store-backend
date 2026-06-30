import { ApiProperty } from '@nestjs/swagger';
import { CurrencyCode, PaymentGateway, PaymentStatus } from '@prisma/client';

export class PaymentHistoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true })
  orderId: number | null;

  @ApiProperty({ nullable: true })
  userId: number | null;

  @ApiProperty({ enum: PaymentGateway })
  gateway: PaymentGateway;

  @ApiProperty({ enum: PaymentStatus, nullable: true })
  status: PaymentStatus | null;

  @ApiProperty({ example: '50000' })
  amount: string;

  @ApiProperty({ enum: CurrencyCode })
  currencyCode: CurrencyCode;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

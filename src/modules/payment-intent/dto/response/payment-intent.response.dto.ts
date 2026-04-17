import { ApiProperty } from '@nestjs/swagger';
import { PaymentGateway, PaymentStatus } from '@prisma/client';

export class PaymentIntentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: String })
  orderId: string;

  @ApiProperty({ enum: PaymentGateway })
  gateway: PaymentGateway;

  @ApiProperty({
    enum: PaymentStatus,
    required: false,
    nullable: true,
  })
  status: PaymentStatus | null;

  @ApiProperty()
  expiredAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

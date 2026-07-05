import { ApiProperty } from '@nestjs/swagger';
import { PaymentGateway, PaymentStatus } from '@prisma/client';

export class PaymentIntentResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty({ enum: PaymentGateway })
  gateway: PaymentGateway;

  @ApiProperty({
    enum: PaymentStatus,
    required: false,
    nullable: true,
  })
  status: PaymentStatus | null;

  @ApiProperty()
  tokenUrl: string;

  @ApiProperty({
    required: false,
    nullable: true,
    example: 'taschen A1b2C3d4',
  })
  content: string | null;

  // @ApiProperty()
  // expiredAt: Date;

  // @ApiProperty()
  // createdAt: Date;

}

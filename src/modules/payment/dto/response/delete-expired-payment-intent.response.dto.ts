import { ApiProperty } from '@nestjs/swagger';

export class DeleteExpiredPaymentIntentResponseDto {
  @ApiProperty()
  deletedCount: number;

  @ApiProperty()
  cutoffAt: Date;
}

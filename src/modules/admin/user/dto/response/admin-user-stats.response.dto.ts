import { ApiProperty } from '@nestjs/swagger';

export class AdminUserStatsResponseDto {
  @ApiProperty({ example: 250 })
  totalUsers: number;

  @ApiProperty({ example: 40 })
  customersLoggedInLast24Hours: number;
}

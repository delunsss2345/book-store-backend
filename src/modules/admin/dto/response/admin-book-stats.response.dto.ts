import { ApiProperty } from '@nestjs/swagger';

export class AdminBookStatsResponseDto {
  @ApiProperty({ example: 120 })
  totalBooks: number;

  @ApiProperty({ example: 90 })
  activeBooks: number;

  @ApiProperty({ example: 45 })
  totalAuthors: number;

  @ApiProperty({ example: 20 })
  totalPublishers: number;
}

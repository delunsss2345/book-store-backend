import { ApiProperty } from '@nestjs/swagger';

export class AdminCategoryStatsResponseDto {
  @ApiProperty({ example: 18 })
  totalCategories: number;

  @ApiProperty({ example: 12 })
  activeCategories: number;
}

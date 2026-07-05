import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminBookSpecDetailDto {
  @ApiPropertyOptional({ example: 14.5 })
  widthCm: number | null;

  @ApiPropertyOptional({ example: 20.5 })
  heightCm: number | null;

  @ApiPropertyOptional({ example: 1.2 })
  thicknessCm: number | null;

  @ApiPropertyOptional({ example: 'Bìa mềm' })
  packaging: string | null;
}

export class AdminBookListDetailItemResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Clean Code' })
  title: string;

  @ApiPropertyOptional({ example: 'A handbook of agile software craftsmanship.' })
  description: string | null;

  @ApiPropertyOptional({ example: 'clean-code-350884' })
  slug: string | null;

  @ApiProperty({ example: 'Robert C. Martin' })
  authors: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/covers/clean-code.jpg' })
  coverImageUrl: string | null;

  @ApiPropertyOptional({ type: () => AdminBookSpecDetailDto })
  spec: AdminBookSpecDetailDto | null;
}

export class AdminBookListDetailResponseDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ type: () => [AdminBookListDetailItemResponseDto] })
  items: AdminBookListDetailItemResponseDto[];
}

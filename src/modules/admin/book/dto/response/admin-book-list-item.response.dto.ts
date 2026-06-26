import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminBookListItemResponseDto {
  @ApiProperty({ example: '12' })
  id: string;

  @ApiProperty({ example: "Harry Potter and the Philosopher's Stone" })
  title: string;

  @ApiPropertyOptional({ example: 'A young wizard discovers...' })
  description: string | null;

  @ApiPropertyOptional({ example: 'harry-potter-philosophers-stone' })
  slug: string | null;

  @ApiProperty({ example: 'J.K. Rowling' })
  authors: string;
}

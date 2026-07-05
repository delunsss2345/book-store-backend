import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmBookVariantAssetItemResponseDto {
  @ApiProperty({ example: '101' })
  id: string;

  @ApiProperty({ example: '12' })
  bookId: string;

  @ApiProperty({
    example: 'https://cdn.example.com/books/cover-1.webp',
  })
  url: string;

  @ApiPropertyOptional({ example: 'cover', nullable: true })
  assetType: string | null;

  @ApiProperty({ example: 1 })
  sortOrder: number | null;
}

export class ConfirmBookAssetResponseDto {
  @ApiProperty({ example: true })
  book: boolean;

  @ApiProperty({ type: () => ConfirmBookVariantAssetItemResponseDto })
  bookVariantAsset: ConfirmBookVariantAssetItemResponseDto;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ConfirmBookAssetRequestDto {
  @ApiProperty({
    example: 'https://cdn.example.com/books/cover-1.webp',
    description: 'Public image URL that was uploaded before confirm step',
  })
  @IsString()
  @IsNotEmpty()
  image_url: string;

  @ApiProperty({
    example: 1,
    minimum: 1,
    maximum: 5,
    description: 'Sort order from 1 to 5, must match the next expected order',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  orderBy: number;

  @ApiPropertyOptional({
    example: 'cover',
    description: 'Optional asset type',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  assetType?: string;
}

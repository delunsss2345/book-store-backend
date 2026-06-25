import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Badge } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';
import {
  CreateBookAuthorDto,
  CreateBookSpecDto,
  CreateCategoriesDto,
} from './create-admin-book-all.request.dto';

export { CreateBookAuthorDto, CreateBookSpecDto, CreateCategoriesDto };

export class CreateAdminBookRequestDto {
  @ApiProperty({ example: 'Dế Mèn Phiêu Lưu Ký' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @ApiProperty({ example: 'Một tác phẩm thiếu nhi kinh điển...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'NXB Kim Đồng' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  publisherName: string;

  @ApiPropertyOptional({ type: () => [CreateBookAuthorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBookAuthorDto)
  authors?: CreateBookAuthorDto[];

  @ApiPropertyOptional({ type: () => [CreateCategoriesDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCategoriesDto)
  categories?: CreateCategoriesDto[];

  @ApiPropertyOptional({ type: () => CreateBookSpecDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBookSpecDto)
  spec?: CreateBookSpecDto;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  publicationYear?: number;

  @ApiPropertyOptional({ example: 320 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageCount?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/covers/sample.jpg', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true })
  coverImageUrl?: string;

  @ApiPropertyOptional({ enum: Badge, example: Badge.NEW })
  @IsOptional()
  @IsEnum(Badge)
  badgeCode?: Badge;
}

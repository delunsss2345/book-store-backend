import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminBookListQueryDto extends BasePaginationDto {
  @ApiPropertyOptional({ example: 'harry' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  searchPhrase?: string;
}

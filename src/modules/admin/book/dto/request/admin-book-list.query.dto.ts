import { BasePaginationDto } from '@/common/pagination/request/base-pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISBN, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminBookListQueryDto extends BasePaginationDto {
  @ApiPropertyOptional({ example: 'Harry Potter' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  searchPhrase?: string;

  @ApiPropertyOptional({ example: '9780747532743' })
  @IsOptional()
  @IsISBN()
  isbn?: string;


  @ApiPropertyOptional({ example: 'books' })
  @IsOptional()
  @IsString()
  type?: string;
}

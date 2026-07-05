import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSupplierRequestDto {
  @ApiProperty({ example: 'Cty Van Chuyen Sach A', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Mã code cua nha cung cap', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;
}

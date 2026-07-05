import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdatePermissionRequestDto {
  @ApiProperty({ example: 'Allow reading user information' })
  @IsString()
  description: string;
}

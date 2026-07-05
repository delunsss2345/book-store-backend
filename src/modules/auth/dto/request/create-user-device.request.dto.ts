import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDeviceRequestDto {
  @ApiProperty()
  @IsNumber()
  userId: number;
  @ApiProperty()
  @IsString()
  deviceFingerprint: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userAgent?: string;
}

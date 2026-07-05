import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAuthorRequestDto {
    @ApiProperty({ example: 'Nguyen Nhat Anh', maxLength: 255 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    defaultName: string;
}

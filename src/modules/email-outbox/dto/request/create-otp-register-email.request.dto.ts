import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateOtpRegisterEmailRequestDto {
    @ApiProperty()
    @IsString()
    toEmail: string;
}

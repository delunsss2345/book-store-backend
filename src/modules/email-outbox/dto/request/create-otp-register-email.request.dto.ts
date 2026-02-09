import { ApiProperty } from '@nestjs/swagger';

export class CreateOtpRegisterEmailRequestDto {
    @ApiProperty()
    toEmail: string;

}

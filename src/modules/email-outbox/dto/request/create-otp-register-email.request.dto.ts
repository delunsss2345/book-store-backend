import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class CreateOtpRegisterEmailRequestDto {
    @ApiProperty()
    toEmail: string;

    @ApiProperty({ type: Object })
    payload: Prisma.JsonValue;
}

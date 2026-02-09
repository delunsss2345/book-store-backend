import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordValidateResponseDto {
    @ApiProperty()
    valid: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
    @ApiProperty()
    success: boolean;
}

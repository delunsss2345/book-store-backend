import { ApiProperty } from "@nestjs/swagger";

export class VerifyEmailResponseDto {
    @ApiProperty()
    success: boolean;
}

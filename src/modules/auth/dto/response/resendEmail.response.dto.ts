import { ApiProperty } from "@nestjs/swagger";

export class ResendEmailResponseDto {
    @ApiProperty()
    success: boolean;
}

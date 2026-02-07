import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenBodyDTO {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

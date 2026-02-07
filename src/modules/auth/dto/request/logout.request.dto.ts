import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LogoutBodyDTO {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    accessToken: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

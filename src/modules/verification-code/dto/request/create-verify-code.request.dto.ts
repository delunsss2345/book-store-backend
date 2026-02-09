import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateVerifyCodeRequestDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    userId: bigint;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    expiresAt: Date;

}

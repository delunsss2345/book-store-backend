import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class VerificationCodeDto {
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
    @IsString()
    codeHash: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    expiresAt: Date;

}
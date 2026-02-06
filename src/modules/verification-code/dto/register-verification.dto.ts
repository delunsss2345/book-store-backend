import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class RegisterVerificationDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    userId: bigint;

    @ApiProperty()
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    verifyUrl: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    codeHash: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    expiresAt: Date;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    token: string
}
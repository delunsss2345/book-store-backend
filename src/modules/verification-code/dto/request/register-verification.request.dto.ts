import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class RegisterVerificationRequestDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    userId: number;

    @ApiProperty()
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string;


    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    expiresAt: Date;
}

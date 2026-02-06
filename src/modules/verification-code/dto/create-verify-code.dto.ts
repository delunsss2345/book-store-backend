import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class VerificationCodeDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    userId: number;
    
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string;
}
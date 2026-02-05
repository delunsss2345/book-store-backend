import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterBodyDTO {
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    firstName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    lastName?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(72)
    password: string;
}
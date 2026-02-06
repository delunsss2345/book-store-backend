import { IsNotEmpty, IsString } from "class-validator";

export class LoginBodyDTO {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
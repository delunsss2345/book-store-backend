import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ForgotPasswordRequestDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;
}

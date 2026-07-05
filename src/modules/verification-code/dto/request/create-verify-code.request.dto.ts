import { ApiProperty } from "@nestjs/swagger";
import { VerificationType } from "@prisma/client";
import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateVerifyCodeRequestDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    @IsString()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsDate()
    expiresAt: Date;

    @ApiProperty({ enum: VerificationType })
    @IsEnum(VerificationType)
    @IsNotEmpty()
    type: VerificationType;

}

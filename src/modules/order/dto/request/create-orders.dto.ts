import { ApiProperty } from "@nestjs/swagger";
import { PaymentGateway } from "@prisma/client";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateOrdersAndPaymentDTO {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    cartId: number

    @ApiProperty()
    @IsEmail()
    @IsString()
    @IsOptional()
    guestEmail: string

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    paymentGateWay: PaymentGateway

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    languageId: number
}
export class CreateOrdersDTO {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    cartId: number

    @ApiProperty()
    @IsEmail()
    @IsString()
    @IsOptional()
    guestEmail: string
}


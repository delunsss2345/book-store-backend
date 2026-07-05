import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "@prisma/client";
import { IsString } from "class-validator";

export class CreateOrderEmailRequestDto {
    @ApiProperty()
    @IsString()
    toEmail: string;

    @ApiProperty()
    @IsString()
    orderCode: string;

    @ApiProperty()
    @IsString()
    orderStatus: OrderStatus;

    @ApiProperty()
    @IsString()
    orderId: number;
}

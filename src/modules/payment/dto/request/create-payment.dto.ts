import { ApiProperty } from '@nestjs/swagger';
import { PaymentGateway } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePaymentTransactionDto {
    @ApiProperty({
        type: 'string',
        description: 'ID của đơn hàng',
        example: '123456789012345678'
    })
    @IsNotEmpty()
    orderId: bigint;

    @ApiProperty({ enum: PaymentGateway, example: PaymentGateway.VNPAY })
    @IsEnum(PaymentGateway)
    gateway: PaymentGateway;

    @ApiProperty({ type: Number, example: 50000 })
    @IsNumber()
    amount: number;
}
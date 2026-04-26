import { ApiProperty } from '@nestjs/swagger';

export class OrderCheckoutResponse {
    @ApiProperty({
        type: String,
        example: '123456789',
        description: 'Order ID (bigint as string)',
    })
    orderId: bigint;

    @ApiProperty({
        type: String,
        description: 'Raw response from payment gateway',
    })
    paymentToken: string;

    @ApiProperty({
        example: 'ORD-2024-001',
    })
    orderCode: string;
}
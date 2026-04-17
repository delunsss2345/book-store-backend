import { CreateUrlPaymentResponseDTO } from '@/modules/payment/dto/response/create-url-payment.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
    @ApiProperty({
        type: CreateUrlPaymentResponseDTO,
    })
    result: CreateUrlPaymentResponseDTO;

    @ApiProperty({
        example: '123456789',
        description: 'Order ID',
    })
    orderId: string;

    @ApiProperty({
        example: 'Create payment success',
    })
    message: string;
}
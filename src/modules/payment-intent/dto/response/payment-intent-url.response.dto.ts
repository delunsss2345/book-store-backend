import { PaymentIntentResponseDto } from '@/modules/payment-intent/dto/response/payment-intent.response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentIntentWithUrlResponseDto extends PaymentIntentResponseDto {
    @ApiProperty()
    paymentUrl: string

    @ApiProperty()
    totalAmount: number
    @ApiProperty()
    bankName: string
    @ApiProperty()
    stk: string
    @ApiProperty()
    nameAccount: string
    @ApiProperty()
    orderCode: string
}

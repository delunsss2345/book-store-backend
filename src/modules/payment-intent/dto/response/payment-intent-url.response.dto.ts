import { PaymentIntentResponseDto } from '@/modules/payment-intent/dto/response/payment-intent.response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentIntentWithTotalAmountResponseDto extends PaymentIntentResponseDto {
    @ApiProperty()
    totalAmount: number
}

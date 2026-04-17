import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlPaymentResponseDTO {
    @ApiProperty({
        example: 'https://payment.com/redirect',
    })
    url: string;

    @ApiProperty({
        example: 'abc123token',
    })
    token: string;
}
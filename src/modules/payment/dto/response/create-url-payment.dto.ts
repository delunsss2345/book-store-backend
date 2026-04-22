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

    @ApiProperty({
        example: 'taschen A1b2C3d4',
        description: 'Nội dung chuyển khoản dùng để đối soát webhook',
    })
    content: string;
}

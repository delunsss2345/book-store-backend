import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminOrderItemResponseDto {
    @ApiProperty({ example: '100' })
    id: string;

    @ApiProperty({ example: 'SE-ORDER-123456' })
    orderCode: string;

    @ApiPropertyOptional({ example: '8' })
    userId: string | null;

    @ApiPropertyOptional({ example: 'f95b5007-37cc-4d0d-a7e4-2e0e84a35916' })
    guestSessionId: string | null;

    @ApiPropertyOptional({ example: 'guest@example.com' })
    guestEmail: string | null;

    @ApiPropertyOptional()
    user: {
        email: string | null;
        firstName: string | null;
        lastName: string | null;
    } | null;

    @ApiPropertyOptional({ example: 'PENDING_PAYMENT' })
    status: string | null;

    @ApiPropertyOptional({ example: 'PENDING' })
    paymentStatus: string | null;

    @ApiPropertyOptional({ example: '120000.00' })
    subtotal: string | null;

    @ApiPropertyOptional({ example: '0.00' })
    discountAmount: string | null;

    @ApiPropertyOptional({ example: '25000.00' })
    shippingFee: string | null;

    @ApiPropertyOptional({ example: '145000.00' })
    totalAmount: string | null;

    @ApiPropertyOptional({ example: 'VND' })
    currencyCode: string | null;

    @ApiPropertyOptional({ example: '2026-02-23T21:10:00.000Z' })
    placedAt: Date | null;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-24T21:10:00.000Z' })
    expiredAt: Date;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    updatedAt: Date;
}

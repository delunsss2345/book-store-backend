import { ApiProperty } from "@nestjs/swagger";
import { PurchaseOrderStatus } from "@prisma/client";

export class ApprovePurchaseOrderRequestDto {
    @ApiProperty({
        description: 'Purchase order status',
        example: 'APPROVED',

    })
    status: PurchaseOrderStatus;
}

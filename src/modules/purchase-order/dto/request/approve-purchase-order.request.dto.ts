import { ApiProperty } from "@nestjs/swagger";
import { PurchaseOrderStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class ApprovePurchaseOrderRequestDto {
    @ApiProperty({
        description: 'Purchase order status',
        enum: [PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.REJECTED],
        example: PurchaseOrderStatus.APPROVED,
    })
    @IsEnum(PurchaseOrderStatus)
    status: PurchaseOrderStatus;
}

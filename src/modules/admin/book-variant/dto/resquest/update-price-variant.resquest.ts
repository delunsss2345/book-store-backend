import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminUpdatePriceVariant {
    @ApiPropertyOptional({ example: 1 })
    @IsString()
    purchaseOrderItemId: string;
}
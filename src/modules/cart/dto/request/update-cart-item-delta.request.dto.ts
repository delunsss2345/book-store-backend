import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class UpdateCartItemDeltaRequestDto {
    @ApiProperty({
        example: -3,
        description: 'Quantity delta, can be positive or negative',
    })
    @Type(() => Number)
    @IsInt()
    quantity: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddCartItemRequestDto {
    @ApiProperty({ example: 101, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    bookVariantId: number;


    @ApiProperty({ minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity?: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class MergeCartResponseDto {
    @ApiProperty({ example: true })
    mergeCart: boolean;

    @ApiProperty({ example: 2 })
    mergeCount: number;
}

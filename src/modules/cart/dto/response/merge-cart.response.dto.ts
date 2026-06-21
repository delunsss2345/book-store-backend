import { ApiProperty } from '@nestjs/swagger';

export class MergeCartResponseDto {
    @ApiProperty({ example: true })
    mergeCart: boolean;
}

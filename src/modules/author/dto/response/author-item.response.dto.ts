import { ApiProperty } from '@nestjs/swagger';

export class AuthorItemResponseDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiProperty({ example: 'Nguyen Van A' })
    name: string;
}

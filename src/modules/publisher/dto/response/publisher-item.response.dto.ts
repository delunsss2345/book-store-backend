import { ApiProperty } from '@nestjs/swagger';

export class PublisherItemResponseDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiProperty({ example: 'Nha Xuat Ban Tre' })
    name: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadBookAssetRequestDto {
    @ApiProperty({
        example: '12',
        description: 'Book variant id (string bigint).',
    })
    @IsString()
    @IsNotEmpty()
    bookVariantId: string;

    @ApiProperty({
        example: 'https://cdn.example.com/books/variant-12/image-1.jpg',
        description: 'Asset URL. Endpoint is stub in current phase.',
    })
    @IsString()
    @IsNotEmpty()
    url: string;
}

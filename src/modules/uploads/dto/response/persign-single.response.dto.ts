import { ApiProperty } from '@nestjs/swagger';

export class PresignResponseDto {
    @ApiProperty({
        example:
            'https://book-store.<account>.r2.cloudflarestorage.com/products/2026/03/uuid.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...',
        description: 'Presigned PUT URL dùng để upload trực tiếp lên R2 (tạm thời, có hạn)',
    })
    url: string;

    @ApiProperty({
        example: 'products/2026/03/1435c9c0-e928-4f68-a4fb-d82eee026e10.jpg',
        description: 'Object key trong bucket (lưu DB)',
    })
    key: string;

    @ApiProperty({
        example:
            'https://cdn.example.com/products/2026/03/1435c9c0-e928-4f68-a4fb-d82eee026e10.jpg',
        description: 'Public/CDN URL để hiển thị ảnh (build từ CDN_URL + key)',
    })
    public_url: string;
}
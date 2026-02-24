import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminBookTranslationResponseDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiProperty({ example: 2 })
    languageId: number;

    @ApiProperty({ example: 'Dữ liệu lớn cho backend hiện đại' })
    title: string;

    @ApiPropertyOptional({ example: 'Mô tả chi tiết về quyển sách' })
    description: string | null;

    @ApiProperty({ example: 'du-lieu-lon-cho-backend-hien-dai' })
    slug: string;
}

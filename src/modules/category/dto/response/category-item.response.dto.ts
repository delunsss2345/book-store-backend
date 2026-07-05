import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryItemResponseDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiPropertyOptional({ example: null })
    parentId: string | null;

    @ApiProperty({ example: 'Programming' })
    name: string;

    @ApiPropertyOptional({ example: 'programming' })
    slug: string | null;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ example: 0 })
    sortOrder: number;
}

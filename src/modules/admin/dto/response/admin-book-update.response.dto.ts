import { AdminBookTranslationResponseDto } from '@/modules/admin/dto/response/admin-book-translation.response.dto';
import { AdminBookVariantItemResponseDto } from '@/modules/admin/dto/response/admin-book-variant-item.response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class AdminBookItemUpdateResponseDto {
    @ApiProperty({ example: '12' })
    id: string;

    @ApiPropertyOptional({ example: '3', nullable: true })
    publisherId: string | null;

    @ApiPropertyOptional({ example: 2026, nullable: true })
    publicationYear: number | null;

    @ApiPropertyOptional({ example: 320, nullable: true })
    pageCount: number | null;

    @ApiPropertyOptional({ example: 420, nullable: true })
    weightGrams: number | null;

    @ApiPropertyOptional({
        example: 'https://cdn.example.com/covers/sample-book.jpg',
        nullable: true,
    })
    coverImageUrl: string | null;

    @ApiProperty({ example: false })
    isActive: boolean;

    @ApiPropertyOptional({
        example: '2026-02-23T21:10:00.000Z',
        nullable: true,
    })
    deletedAt: Date | null;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    updatedAt: Date;

    @ApiProperty({
        type: () => [AdminBookTranslationResponseDto],
    })
    translations: AdminBookTranslationResponseDto[];

    @ApiProperty({
        type: () => [AdminBookVariantItemResponseDto],
    })
    variants: AdminBookVariantItemResponseDto[];
}
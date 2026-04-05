import { AdminBookTranslationResponseDto } from "@/modules/admin/dto/response/admin-book-translation.response.dto";
import { AdminBookVariantItemResponseDto } from "@/modules/admin/dto/response/admin-book-variant-item.response.dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AdminBookDetailResponseDto {
    @ApiProperty({ example: '12' })
    id: string;

    @ApiPropertyOptional({ example: '3' })
    publisherId: string | null;

    @ApiPropertyOptional({ example: 'Name' })
    publisherName: string | null;

    @ApiPropertyOptional({ example: 'Name' })
    authorName: number | null;

    @ApiPropertyOptional({ example: 2026 })
    publicationYear: number | null;

    @ApiPropertyOptional({ example: 320 })
    pageCount: number | null;

    @ApiPropertyOptional({ example: 420 })
    weightGrams: number | null;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/covers/sample-book.jpg' })
    coverImageUrl: string | null;

    @ApiProperty({ example: false })
    isActive: boolean;

    @ApiPropertyOptional({ example: null })
    deletedAt: Date | null;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2026-02-23T21:10:00.000Z' })
    updatedAt: Date;

    @ApiPropertyOptional({ type: () => [AdminBookTranslationResponseDto], nullable: true })
    translation: AdminBookTranslationResponseDto[];

    @ApiProperty({ type: () => [AdminBookVariantItemResponseDto] })
    variants: AdminBookVariantItemResponseDto[];
}

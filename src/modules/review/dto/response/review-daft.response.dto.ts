import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewDraftSafetyDto {
    @ApiProperty({ example: false })
    flagged: boolean;

    @ApiProperty({ example: ['hate', 'self_harm'], isArray: true })
    categories: string[];

    @ApiPropertyOptional({ example: 'blocked_by_policy' })
    reason?: string;
}

export class ReviewDraftResponseDto {
    @ApiProperty({ example: 1, minimum: 1 })
    bookId: string;

    @ApiProperty({ example: 10, minimum: 1 })
    bookVariantId: string;

    @ApiProperty({ example: 'Sách khá ổn, nội dung dễ đọc... (đoạn review nháp)' })
    draftText: string;

    @ApiProperty({ example: 100, minimum: 0 })
    wordCount?: number;
}

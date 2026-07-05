import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageLinksDto {
    @ApiPropertyOptional({ example: 'http://books.google.com/books/content?id=...' })
    smallThumbnail?: string;

    @ApiPropertyOptional({ example: 'http://books.google.com/books/content?id=...' })
    thumbnail?: string;
}

export class VolumeInfoDto {
    @ApiProperty({ example: 'Change Management' })
    title: string;

    @ApiPropertyOptional({ type: [String], example: ['Richard Newton'] })
    authors?: string[];

    @ApiPropertyOptional({ example: 'A guide to managing change...' })
    description?: string;

    @ApiPropertyOptional({ type: ImageLinksDto })
    imageLinks?: ImageLinksDto;
}

export class SearchInfoDto {
    @ApiPropertyOptional({ example: 'Master the models, tools and techniques...' })
    textSnippet?: string;
}

export class BookItemDto {
    @ApiProperty({ example: 'sFWozwEACAAJ' })
    id: string;

    @ApiProperty({ example: 'https://www.googleapis.com/books/v1/volumes/sFWozwEACAAJ' })
    selfLink: string;

    @ApiProperty({ type: VolumeInfoDto })
    volumeInfo: VolumeInfoDto;

    @ApiPropertyOptional({ type: SearchInfoDto })
    searchInfo?: SearchInfoDto;
}

export class GoogleBooksResponseDto {
    @ApiProperty({ example: 'books#volumes' })
    kind: string;

    @ApiProperty({ example: 1 })
    totalItems: number;

    @ApiProperty({ type: [BookItemDto] })
    items: BookItemDto[];
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemVariantDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: '15.99' })
    price: string;

    @ApiProperty({ example: 'PAPERBACK' })
    format: string;

    @ApiPropertyOptional({ example: 'VND' })
    currencyCode?: string | null;

    @ApiProperty({ example: 10 })
    stock: number;
}

export class CartItemBookDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg' })
    coverImageUrl?: string | null;

    @ApiPropertyOptional({ example: 'Clean Code' })
    title?: string | null;

    @ApiPropertyOptional({ example: 'clean-code' })
    slug?: string | null;
}

export class CartItemDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1 })
    bookVariantId: number;

    @ApiProperty({ example: 2 })
    quantity: number;

    @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
    addedAt: Date;

    @ApiProperty({ type: () => CartItemVariantDto })
    variant: CartItemVariantDto;

    @ApiProperty({ type: () => CartItemBookDto })
    book: CartItemBookDto;
}

export class CartDayGroupDto {
    @ApiProperty({ example: '2024-01-15' })
    date: string;

    @ApiProperty({ type: () => [CartItemDto] })
    items: CartItemDto[];
}

export class CartResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ type: () => [CartDayGroupDto] })
    groups: CartDayGroupDto[];
}

type WishlistItemRow = {
  id: number;
  bookVariantId: number;
};

export type WishItemResponseDto = {
  itemKey: string;
  bookVariantId: number;
};

export const WishlistItemMapper = {
  toDto(item: WishlistItemRow): WishItemResponseDto {
    return {
      itemKey: item.id.toString(),
      bookVariantId: Number(item.bookVariantId),
    };
  },
};

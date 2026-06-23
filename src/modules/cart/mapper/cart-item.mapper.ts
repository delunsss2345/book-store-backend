type CartItemRow = {
  id: number;
  bookVariantId: number;
  quantity: number;
};

export type CartItemResponseDto = {
  itemKey: string;
  bookVariantId: number;
  quantity: number;
};

export const CartItemMapper = {
  toDto(item: CartItemRow): CartItemResponseDto {
    return {
      itemKey: item.id.toString(),
      bookVariantId: Number(item.bookVariantId),
      quantity: item.quantity,
    };
  },
};

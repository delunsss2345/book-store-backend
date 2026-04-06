export const OrderMessage = {
  BOOK_VARIANT_NOT_FOUND: 'Không tìm thấy biến thể sách',
  BOOK_OUT_OF_STOCK: (title: string) => `Sách ${title} đã hết hàng`,
  CART_NOT_FOUND: 'Không tìm thấy giỏ hàng',
  ADDRESS_NOT_FOUND: 'Không tìm thấy địa chỉ',
  USER_NOT_AUTHENTICATED: 'Người dùng chưa đăng nhập',
} as const;

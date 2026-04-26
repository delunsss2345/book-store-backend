export const AdminBookMessage = {
  BOOK_NOT_FOUND: 'Không tìm thấy sách',
  PUBLISHER_NAME_REQUIRED: 'Tên nhà xuất bản là bắt buộc',
  INVALID_PUBLISHER_ID: 'ID nhà xuất bản không hợp lệ',
  INVALID_SUPPLIER: 'Nhà cung cấp không hợp lệ',
  BOOK_TRANSLATION_ALREADY_EXISTS_IN_THIS_LANGUAGE:
    'Bản dịch sách cho ngôn ngữ này đã tồn tại',
  VARIANT_PRICE_CANNOT_BE_LESS_THAN_COST_PRICE:
    'Giá bán của biến thể không được nhỏ hơn giá nhập',
} as const;

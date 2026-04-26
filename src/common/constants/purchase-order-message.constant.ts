export const PurchaseOrderMessage = {
  CREATED_PURCHASE_ORDER_COULD_NOT_BE_LOADED: 'Không thể tải đơn mua vừa tạo',
  UPDATED_PURCHASE_ORDER_COULD_NOT_BE_LOADED:
    'Không thể tải đơn mua vừa cập nhật',
  PURCHASE_ORDER_NOT_FOUND: 'Không tìm thấy đơn mua',
  STATUS_MUST_BE_APPROVED_OR_REJECTED:
    'Trạng thái đơn mua phải là APPROVED hoặc REJECTED',
  PURCHASE_ORDER_HAS_ALREADY_BEEN_PROCESSED: 'Đơn mua đã được xử lý trước đó',
  PURCHASE_ORDER_MUST_HAVE_AT_LEAST_ONE_ITEM:
    'Đơn mua phải có ít nhất một sản phẩm',
  INVALID_SUPPLIER: 'Nhà cung cấp không hợp lệ',
  INVALID_BOOK_VARIANT_IDS: (ids: string[]) =>
    `ID biến thể sách không hợp lệ: ${ids.join(', ')}`,
} as const;

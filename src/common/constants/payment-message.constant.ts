export const PaymentMessage = {
  UNSUPPORTED_PAYMENT_GATEWAY: 'Cổng thanh toán không hỗ trợ',
  CREATE_TRANSACTION_SUCCESS: 'Khởi tạo giao dịch thành công',
  CREATE_TRANSACTION_ERROR: 'Lỗi tạo giao dịch',
  CREATE_TRANSACTION_START: (orderId: string, gateway: string) =>
    `Đang tạo giao dịch cho đơn hàng: ${orderId} qua ${gateway}`,
} as const;

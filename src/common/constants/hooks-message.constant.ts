export const HooksMessage = {
  MISSING_WEBHOOK_EVENT_ID: 'Thiếu mã sự kiện webhook',
  ORDER_CODE_NOT_FOUND_IN_WEBHOOK_PAYLOAD:
    'Không tìm thấy mã đơn hàng trong payload webhook',
  ORDER_NOT_FOUND: 'Không tìm thấy đơn hàng',
  WEBHOOK_ALREADY_PROCESSED_FOR_SUCCESS_PAYMENT_INTENT:
    'Webhook đã được xử lý cho payment intent có trạng thái thành công',

  PAYMENT_INTENT_EXPIRED: 'Qr thanh toán đã hết hạn',
  PAYMENT_INTENT_NOT_FOUND: 'Không tìm thấy payment intent',
} as const;

export enum LoginMessage {
  LOGIN_SUCCESS = 'Đăng nhập thành công',
  LOGIN_FAILED = 'Đăng nhập sai tài khoản hoặc mật khẩu',
}

export enum RegisterMessage {
  PASSWORD_CONFIRM_MISMATCH = 'Mật khẩu xác nhận không khớp',
  EMAIL_EXISTS = 'Email đã tồn tại',
  REGISTER_SUCCESS = 'Đăng ký thành công',
  INVALID_OR_EXPIRED_VERIFY_TOKEN = 'Token xác thực không hợp lệ hoặc đã hết hạn',
  RESEND_VERIFY_EMAIL_QUOTA_EXCEEDED = 'Bạn đã gửi lại quá nhiều lần, vui lòng thử lại sau',
  ACCOUNT_CREATE_FAILED = 'Không tạo được tài khoản',
}

export enum ChangePasswordMessage {
  OLD_PASSWORD_INCORRECT = 'Mật khẩu cũ không đúng',
  NEW_PASSWORD_CONFIRM_MISMATCH = 'Mật khẩu mới xác nhận không khớp',
}

export enum ForgotPasswordMessage {
  INVALID_OR_EXPIRED_RESET_TOKEN = 'Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
  RESET_PASSWORD_CONFIRM_MISMATCH = 'Mật khẩu xác nhận không khớp',
}

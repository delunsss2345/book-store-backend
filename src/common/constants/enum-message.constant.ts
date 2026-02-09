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
}

export enum ChangePasswordMessage {
    OLD_PASSWORD_INCORRECT = 'Mật khẩu cũ không đúng',
    NEW_PASSWORD_CONFIRM_MISMATCH = 'Mật khẩu mới xác nhận không khớp',
}

export const StatusMessage = {
    LoginMessage,
    RegisterMessage,
    ChangePasswordMessage,
} as const;

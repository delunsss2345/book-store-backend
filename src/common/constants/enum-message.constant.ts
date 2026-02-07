export enum LoginMessage {
    LOGIN_SUCCESS = 'Đăng nhập thành công',
    LOGIN_FAILED = 'Đăng nhập sai tài khoản hoặc mật khẩu',
}

export enum RegisterMessage {
    PASSWORD_CONFIRM_MISMATCH = 'Mật khẩu xác nhận không khớp',
    EMAIL_EXISTS = 'Email đã tồn tại',
    REGISTER_SUCCESS = 'Đăng ký thành công',
}

export const StatusMessage = {
    LoginMessage,
    RegisterMessage,
} as const;

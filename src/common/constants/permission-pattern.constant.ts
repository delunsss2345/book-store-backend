export enum PermissionCode {
    HEALTH_READ = "health:read",

    ROLE_READ = "role:read",
    ROLE_READ_ONE = "role:read_one",

    PERMISSION_READ = "permission:read",
    PERMISSION_CREATE = "permission:create",
    PERMISSION_UPDATE = "permission:update",
    PERMISSION_DELETE = "permission:delete",

    ROLE_PERMISSION_GRANT = "role_permission:grant",
    ROLE_PERMISSION_READ_BY_ROLE = "role_permission:read_by_role",
    ROLE_PERMISSION_READ_BY_PERMISSION = "role_permission:read_by_permission",

    DEVICE_READ = "device:read",

    AUTH_REGISTER = "auth:register",
    AUTH_LOGIN = "auth:login",

    AUTH_ME_READ = "auth:me_read",
    AUTH_TOKEN_REFRESH = "auth:token_refresh",
    AUTH_LOGOUT = "auth:logout",

    AUTH_EMAIL_VERIFY = "auth:email_verify",
    AUTH_EMAIL_RESEND = "auth:email_resend",

    AUTH_PASSWORD_FORGOT = "auth:password_forgot",
    AUTH_PASSWORD_CHANGE = "auth:password_change",
    AUTH_PASSWORD_RESET_VALIDATE = "auth:password_reset_validate",
    AUTH_PASSWORD_RESET = "auth:password_reset",
}

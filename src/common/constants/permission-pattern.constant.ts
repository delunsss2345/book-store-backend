export enum PermissionCode {
    HEALTH_READ = "health:read",
    GUEST_SESSION_GET_ALL = "guest:get-all",

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
    LOGIN_ATTEMPT_READ_BY_USER = "login_attempt:read_by_user",
    EMAIL_OUTBOX_GET = "email_outbox:get",
    SEARCH_REINDEX_BOOKS = "search:reindex_books",
    AUTHOR_CREATE = "author:create",
    PUBLISHER_CREATE = "publisher:create",
    CATEGORY_CREATE = "category:create",
    ADMIN_CREATE_BOOK = "admin:create-book",
    ADMIN_UPDATE_BOOK = "admin:update-book",
    ADMIN_DELETE_BOOK = "admin:delete-book",
    ADMIN_CREATE_BOOK_ALL = "admin:create-book-all",
    ADMIN_READ = "admin:read",

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

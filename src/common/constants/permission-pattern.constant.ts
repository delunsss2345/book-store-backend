export enum PermissionCode {
  GUEST_SESSION_READ = 'guest_session:read',
  ROLE_READ = 'role:read',

  PERMISSION_READ = 'permission:read',
  PERMISSION_UPDATE = 'permission:update',

  ROLE_PERMISSION_GRANT = 'role_permission:grant',
  ROLE_PERMISSION_READ_BY_ROLE = 'role_permission:read_by_role',
  ROLE_PERMISSION_READ_BY_PERMISSION = 'role_permission:read_by_permission',

  DEVICE_READ = 'device:read',
  EMAIL_OUTBOX_READ = 'email_outbox:read',
  SEARCH_REINDEX_BOOKS = 'search:reindex_books',

  AUTHOR_CREATE = 'author:create',
  PUBLISHER_CREATE = 'publisher:create',
  CATEGORY_READ = 'category:read',
  CATEGORY_CREATE = 'category:create',

  SUPPLIER_READ = 'supplier:read',
  SUPPLIER_CREATE = 'supplier:create',
  SUPPLIER_UPDATE = 'supplier:update',

  BOOK_READ = 'book:read',
  BOOK_CREATE = 'book:create',
  BOOK_UPDATE = 'book:update',
  BOOK_DELETE = 'book:delete',
  BOOK_TRANSLATION_CREATE = 'book_translation:create',
  BOOK_SNAPSHOT_READ = 'book_snapshot:read',

  BOOK_VARIANT_READ = 'book_variant:read',
  BOOK_VARIANT_UPDATE = 'book_variant:update',

  ORDER_READ = 'order:read',
  ORDER_UPDATE = 'order:update',

  PURCHASE_ORDER_READ = 'purchase_order:read',
  PURCHASE_ORDER_CREATE = 'purchase_order:create',
  PURCHASE_ORDER_APPROVE = 'purchase_order:approve',
  PURCHASE_ORDER_TRANSFER = 'purchase_order:transfer',

  STOCK_IMPORT_READ = 'stock_import:read',
  STOCK_IMPORT_CREATE = 'stock_import:create',

  USER_READ = 'user:read',
  UPLOAD_MANAGE = 'upload:manage',
}

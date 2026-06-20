-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(30) NULL,
    `first_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `gender` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `password` VARCHAR(255) NOT NULL,
    `password_changed_at` DATETIME(3) NULL,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `totp_secret` VARCHAR(255) NULL,
    `verify_email_at` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `email` VARCHAR(200) NULL,
    `type` ENUM('REGISTER', 'FORGOT_PASSWORD', 'CHANGE_EMAIL', 'CHANGE_PASSWORD') NOT NULL,
    `code_hash` VARCHAR(200) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_codes_email_type_idx`(`email`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `ip` VARCHAR(64) NULL,
    `user_agent` VARCHAR(1000) NULL,
    `success` BOOLEAN NULL,
    `failure_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_devices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `device_fingerprint` VARCHAR(255) NOT NULL,
    `device_name` VARCHAR(200) NULL,
    `platform` ENUM('WEB', 'ANDROID', 'IOS', 'DESKTOP', 'OTHER') NULL,
    `os_version` VARCHAR(50) NULL,
    `app_version` VARCHAR(50) NULL,
    `is_trusted` BOOLEAN NOT NULL DEFAULT false,
    `first_seen_at` DATETIME(3) NULL,
    `last_seen_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,

    UNIQUE INDEX `user_devices_user_id_device_fingerprint_key`(`user_id`, `device_fingerprint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `device_id` INTEGER NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `refresh_token_hash` VARCHAR(255) NOT NULL,
    `user_agent` VARCHAR(150) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,

    UNIQUE INDEX `user_sessions_refresh_token_hash_key`(`refresh_token_hash`),
    INDEX `user_sessions_user_id_status_idx`(`user_id`, `status`),
    INDEX `user_sessions_device_id_status_idx`(`device_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revoked_tokens` (
    `id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(150) NOT NULL,
    `revoked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `revoked_tokens_token_hash_key`(`token_hash`),
    INDEX `revoked_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `address_type` VARCHAR(50) NULL,
    `recipient_name` VARCHAR(200) NOT NULL,
    `phone_number` VARCHAR(30) NOT NULL,
    `address_detail` VARCHAR(255) NOT NULL,
    `ward` VARCHAR(200) NOT NULL,
    `district` VARCHAR(200) NOT NULL,
    `city` VARCHAR(200) NOT NULL,
    `is_default` BOOLEAN NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guest_sessions` (
    `id` CHAR(36) NOT NULL,
    `ip_first` VARCHAR(64) NULL,
    `user_agent_hash` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_seen_at` DATETIME(3) NULL,
    `converted_user_id` INTEGER NULL,
    `converted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` ENUM('GUEST', 'ADMIN', 'STAFF', 'CUSTOMER', 'WAREHOUSE') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,
    `updated_by_id` INTEGER NULL,
    `deleted_by` INTEGER NULL,

    UNIQUE INDEX `roles_code_key`(`code`),
    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by` INTEGER NULL,
    `updated_by` INTEGER NULL,
    `deleted_by` INTEGER NULL,

    INDEX `user_roles_role_id_idx`(`role_id`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `method` ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD') NOT NULL,
    `path_pattern` VARCHAR(500) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NULL,
    `updated_by_id` INTEGER NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    UNIQUE INDEX `permissions_method_path_pattern_key`(`method`, `path_pattern`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `languages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(10) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `languages_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parent_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by` INTEGER NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_translations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NOT NULL,
    `language_id` INTEGER NOT NULL,
    `name` VARCHAR(300) NOT NULL,
    `description` TEXT NULL,
    `slug` VARCHAR(300) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `category_translations_language_id_slug_idx`(`language_id`, `slug`),
    UNIQUE INDEX `category_translations_category_id_language_id_key`(`category_id`, `language_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `default_name` VARCHAR(300) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `authors_default_name_key`(`default_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publishers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `default_name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `publishers_default_name_key`(`default_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `books` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `publisher_id` INTEGER NULL,
    `publication_year` INTEGER NULL,
    `weight_grams` INTEGER NULL,
    `page_count` INTEGER NULL,
    `cover_image_url` VARCHAR(1000) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by` INTEGER NULL,
    `updated_by` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_translations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `language_id` INTEGER NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `slug` VARCHAR(500) NULL,

    INDEX `book_translations_language_id_slug_idx`(`language_id`, `slug`),
    UNIQUE INDEX `book_translations_book_id_language_id_key`(`book_id`, `language_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_authors` (
    `book_id` INTEGER NOT NULL,
    `author_id` INTEGER NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`book_id`, `author_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_specs` (
    `book_id` INTEGER NOT NULL,
    `width_cm` DECIMAL(6, 2) NULL,
    `height_cm` DECIMAL(6, 2) NULL,
    `thickness_cm` DECIMAL(6, 2) NULL,
    `packaging` VARCHAR(200) NULL,

    PRIMARY KEY (`book_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_categories` (
    `book_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,

    PRIMARY KEY (`book_id`, `category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_badges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `code` ENUM('NEW', 'LIMITED', 'BESTSELLER', 'EDITION') NOT NULL,

    UNIQUE INDEX `book_badges_book_id_key`(`book_id`),
    INDEX `book_badges_book_id_code_idx`(`book_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_variants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `format` ENUM('HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK') NOT NULL,
    `edition` INTEGER NULL,
    `isbn` VARCHAR(20) NULL,
    `cost_price` DECIMAL(12, 2) NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `currency_code` VARCHAR(3) NULL,
    `stock` INTEGER NULL,
    `available` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `reserved` INTEGER NULL DEFAULT 0,
    `supplierId` INTEGER NULL,

    UNIQUE INDEX `book_variants_isbn_key`(`isbn`),
    UNIQUE INDEX `book_variants_book_id_format_edition_key`(`book_id`, `format`, `edition`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_variant_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_variant_id` INTEGER NOT NULL,
    `content_hash` VARCHAR(255) NULL,
    `cover_image_url_snapshot` TEXT NULL,
    `title_snapshot` VARCHAR(255) NULL,
    `sku_snapshot` VARCHAR(50) NOT NULL,
    `price_snapshot` DECIMAL(12, 2) NOT NULL,
    `currency_code_snapshot` VARCHAR(3) NULL,
    `format_snapshot` ENUM('HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK') NOT NULL,
    `edition_snapshot` INTEGER NULL,
    `isbn_snapshot` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `book_variant_snapshots_content_hash_key`(`content_hash`),
    INDEX `idx_bvs_book_variant_id`(`book_variant_id`),
    INDEX `idx_bvs_isbn_snapshot`(`isbn_snapshot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_variant_assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `asset_type` VARCHAR(50) NULL,
    `sort_order` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `guest_session_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `carts_user_id_idx`(`user_id`),
    INDEX `carts_guest_session_id_idx`(`guest_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cart_id` INTEGER NOT NULL,
    `book_variant_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cart_items_cart_id_book_variant_id_key`(`cart_id`, `book_variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `guest_session_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `delete_at` DATETIME(3) NULL,

    INDEX `wishlists_user_id_idx`(`user_id`),
    INDEX `wishlists_guest_session_id_idx`(`guest_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlist_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `wishlist_id` INTEGER NOT NULL,
    `book_variant_id` INTEGER NOT NULL,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `wishlist_items_wishlist_id_book_variant_id_key`(`wishlist_id`, `book_variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(50) NOT NULL,
    `user_id` INTEGER NULL,
    `address_id` INTEGER NULL,
    `cart_hash` VARCHAR(191) NULL,
    `guest_session_id` CHAR(36) NULL,
    `guest_email` VARCHAR(320) NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED', 'NOT_FOUND_ORDER_CODE') NULL,
    `payment_status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PAYMENT_SHORTFALL', 'PAYMENT_OVERAGE', 'PARTIAL_REFUND', 'EXPIRED', 'NOT_FOUND_ORDER_CODE') NULL,
    `subtotal` DECIMAL(12, 2) NULL,
    `discount_amount` DECIMAL(12, 2) NULL,
    `shipping_fee` DECIMAL(12, 2) NULL,
    `total_amount` DECIMAL(12, 2) NULL,
    `currency_code` VARCHAR(3) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `note` TEXT NULL,
    `placed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expired_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` INTEGER NULL,
    `updated_by` INTEGER NULL,

    UNIQUE INDEX `orders_order_code_key`(`order_code`),
    UNIQUE INDEX `orders_cart_hash_key`(`cart_hash`),
    UNIQUE INDEX `orders_idempotency_key_key`(`idempotency_key`),
    INDEX `orders_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `orders_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `book_variant_snapshot_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `line_total` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_items_book_variant_snapshot_id_idx`(`book_variant_snapshot_id`),
    INDEX `order_items_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_addresses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `recipient_name` VARCHAR(200) NOT NULL,
    `phone_number` VARCHAR(30) NOT NULL,
    `address_line` VARCHAR(500) NOT NULL,
    `ward` VARCHAR(200) NULL,
    `district` VARCHAR(200) NULL,
    `city` VARCHAR(200) NOT NULL,
    `country_code` VARCHAR(2) NULL,
    `note` TEXT NULL,

    UNIQUE INDEX `order_addresses_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `gateway` ENUM('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL', 'SEPAY', 'OTHER') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PAYMENT_SHORTFALL', 'PAYMENT_OVERAGE', 'PARTIAL_REFUND', 'EXPIRED', 'NOT_FOUND_ORDER_CODE') NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency_code` VARCHAR(3) NULL,
    `provider_txn_id` VARCHAR(200) NULL,
    `reference_number` VARCHAR(200) NULL,
    `request_id` VARCHAR(100) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `payment_url` VARCHAR(100) NULL,
    `request_payload` JSON NULL,
    `response_payload` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payment_transactions_order_id_created_at_idx`(`order_id`, `created_at`),
    INDEX `payment_transactions_gateway_provider_txn_id_idx`(`gateway`, `provider_txn_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_intents` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` INTEGER NOT NULL,
    `order_code` VARCHAR(50) NOT NULL,
    `content` VARCHAR(100) NULL,
    `gateway` ENUM('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL', 'SEPAY', 'OTHER') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PAYMENT_SHORTFALL', 'PAYMENT_OVERAGE', 'PARTIAL_REFUND', 'EXPIRED', 'NOT_FOUND_ORDER_CODE') NULL,
    `token_url` VARCHAR(200) NOT NULL,
    `payment_url` VARCHAR(200) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_intents_content_key`(`content`),
    UNIQUE INDEX `payment_intents_token_url_key`(`token_url`),
    INDEX `payment_intents_order_id_created_at_idx`(`order_id`, `created_at`),
    INDEX `payment_intents_order_id_gateway_idx`(`order_id`, `gateway`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `supplier_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_import` (
    `id` VARCHAR(191) NOT NULL,
    `purchase_order_id` VARCHAR(191) NULL,
    `supplier_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(191) NULL,
    `totalAmount` DECIMAL(18, 2) NOT NULL,
    `taxAmount` DECIMAL(18, 2) NOT NULL,

    UNIQUE INDEX `stock_import_purchase_order_id_key`(`purchase_order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_import_item` (
    `id` VARCHAR(191) NOT NULL,
    `stock_import_id` VARCHAR(191) NOT NULL,
    `variant_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `import_price` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `supplierId` INTEGER NOT NULL,
    `createdById` INTEGER NOT NULL,
    `approvedById` INTEGER NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `note` VARCHAR(191) NULL,
    `totalAmount` DECIMAL(18, 2) NOT NULL,
    `taxAmount` DECIMAL(18, 2) NOT NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchase_orders_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order_items` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseOrderId` VARCHAR(191) NOT NULL,
    `bookVariantId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DECIMAL(18, 2) NOT NULL,
    `totalPrice` DECIMAL(18, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `guest_session_id` CHAR(36) NULL,
    `session_id` CHAR(36) NULL,
    `event_type` ENUM('VIEW_BOOK', 'SEARCH', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'CHECKOUT_START', 'PLACE_ORDER', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'LOGIN', 'LOGOUT') NOT NULL,
    `object_type` VARCHAR(50) NULL,
    `object_id` VARCHAR(100) NULL,
    `amount` DECIMAL(12, 2) NULL,
    `currency_code` VARCHAR(3) NULL,
    `ip` VARCHAR(64) NULL,
    `user_agent` VARCHAR(1000) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_events_event_type_created_at_idx`(`event_type`, `created_at`),
    INDEX `user_events_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `user_events_guest_session_id_created_at_idx`(`guest_session_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_user_id` INTEGER NOT NULL,
    `action` VARCHAR(200) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(100) NOT NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actor_user_id_created_at_idx`(`actor_user_id`, `created_at`),
    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_outbox` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `to_email` VARCHAR(320) NOT NULL,
    `to_name` VARCHAR(200) NULL,
    `subject` VARCHAR(500) NULL,
    `template_key` VARCHAR(200) NULL,
    `status` ENUM('PENDING', 'SENDING', 'SENT', 'FAILED', 'CANCELLED') NULL,
    `scheduled_at` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `attempts` INTEGER NULL,
    `last_error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `payload` JSON NULL,

    INDEX `email_outbox_status_scheduled_at_idx`(`status`, `scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_inbox` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gateway` ENUM('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL', 'SEPAY', 'OTHER') NOT NULL,
    `provider_event_id` VARCHAR(200) NOT NULL,
    `received_at` DATETIME(3) NOT NULL,
    `payload` JSON NOT NULL,
    `processed_at` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'DONE', 'FAILED', 'CANCELLED') NULL,
    `attempts` INTEGER NULL,
    `last_error` TEXT NULL,

    UNIQUE INDEX `webhook_inbox_gateway_provider_event_id_key`(`gateway`, `provider_event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `verification_codes` ADD CONSTRAINT `verification_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `login_attempts` ADD CONSTRAINT `login_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_devices` ADD CONSTRAINT `user_devices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `user_devices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_addresses` ADD CONSTRAINT `user_addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guest_sessions` ADD CONSTRAINT `guest_sessions_converted_user_id_fkey` FOREIGN KEY (`converted_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `category_translations` ADD CONSTRAINT `category_translations_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_translations` ADD CONSTRAINT `category_translations_language_id_fkey` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_publisher_id_fkey` FOREIGN KEY (`publisher_id`) REFERENCES `publishers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_translations` ADD CONSTRAINT `book_translations_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_translations` ADD CONSTRAINT `book_translations_language_id_fkey` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_authors` ADD CONSTRAINT `book_authors_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_authors` ADD CONSTRAINT `book_authors_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_specs` ADD CONSTRAINT `book_specs_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `book_categories` ADD CONSTRAINT `book_categories_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_categories` ADD CONSTRAINT `book_categories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_badges` ADD CONSTRAINT `book_badges_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `book_variants` ADD CONSTRAINT `book_variants_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_variants` ADD CONSTRAINT `book_variants_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_variant_snapshots` ADD CONSTRAINT `book_variant_snapshots_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `book_variant_assets` ADD CONSTRAINT `book_variant_assets_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_wishlist_id_fkey` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `user_addresses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_book_variant_snapshot_id_fkey` FOREIGN KEY (`book_variant_snapshot_id`) REFERENCES `book_variant_snapshots`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_addresses` ADD CONSTRAINT `order_addresses_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stock_import` ADD CONSTRAINT `stock_import_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_import` ADD CONSTRAINT `stock_import_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_import` ADD CONSTRAINT `stock_import_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_import_item` ADD CONSTRAINT `stock_import_item_stock_import_id_fkey` FOREIGN KEY (`stock_import_id`) REFERENCES `stock_import`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_import_item` ADD CONSTRAINT `stock_import_item_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `book_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_bookVariantId_fkey` FOREIGN KEY (`bookVariantId`) REFERENCES `book_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_events` ADD CONSTRAINT `user_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_events` ADD CONSTRAINT `user_events_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_events` ADD CONSTRAINT `user_events_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `user_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

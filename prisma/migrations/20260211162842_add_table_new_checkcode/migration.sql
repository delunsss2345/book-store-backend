-- CreateTable
CREATE TABLE `guest_sessions` (
    `id` CHAR(36) NOT NULL,
    `ip_first` VARCHAR(64) NULL,
    `user_agent_hash` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_seen_at` DATETIME(3) NULL,
    `converted_user_id` BIGINT NULL,
    `converted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `parent_id` BIGINT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by` BIGINT NULL,
    `updated_by` BIGINT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authors` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `default_name` VARCHAR(300) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_translations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `category_id` BIGINT NOT NULL,
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
CREATE TABLE `book_translations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `language_id` INTEGER NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `slug` VARCHAR(500) NULL,

    INDEX `book_translations_language_id_slug_idx`(`language_id`, `slug`),
    UNIQUE INDEX `book_translations_book_id_language_id_key`(`book_id`, `language_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `author_translations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `author_id` BIGINT NOT NULL,
    `language_id` INTEGER NOT NULL,
    `display_name` VARCHAR(300) NOT NULL,
    `bio` TEXT NULL,

    UNIQUE INDEX `author_translations_author_id_language_id_key`(`author_id`, `language_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_authors` (
    `book_id` BIGINT NOT NULL,
    `author_id` BIGINT NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`book_id`, `author_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `publishers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `default_name` VARCHAR(300) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `books` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publisher_id` BIGINT NULL,
    `publication_year` INTEGER NULL,
    `weight_grams` INTEGER NULL,
    `page_count` INTEGER NULL,
    `cover_image_url` VARCHAR(1000) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by` BIGINT NULL,
    `updated_by` BIGINT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_categories` (
    `book_id` BIGINT NOT NULL,
    `category_id` BIGINT NOT NULL,

    PRIMARY KEY (`book_id`, `category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_variants` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `format` ENUM('HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK') NOT NULL,
    `edition` INTEGER NULL,
    `isbn` VARCHAR(20) NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `currency_code` VARCHAR(3) NULL,
    `stock` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `book_variants_isbn_key`(`isbn`),
    UNIQUE INDEX `book_variants_book_id_format_edition_key`(`book_id`, `format`, `edition`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_variant_snapshots` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_variant_id` BIGINT NOT NULL,
    `order_item_id` BIGINT NULL,
    `sku_snapshot` VARCHAR(50) NOT NULL,
    `price_snapshot` DECIMAL(12, 2) NOT NULL,
    `currency_code_snapshot` VARCHAR(3) NULL,
    `format_snapshot` ENUM('HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK') NOT NULL,
    `edition_snapshot` INTEGER NULL,
    `isbn_snapshot` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `book_variant_snapshots_order_item_id_key`(`order_item_id`),
    INDEX `idx_bvs_book_variant_id`(`book_variant_id`),
    INDEX `idx_bvs_order_item_id`(`order_item_id`),
    INDEX `idx_bvs_isbn_snapshot`(`isbn_snapshot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_variant_assets` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_variant_id` BIGINT NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `asset_type` VARCHAR(50) NULL,
    `sort_order` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `book_id` BIGINT NOT NULL,
    `rating` INTEGER NOT NULL,
    `content` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `guest_session_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `carts_user_id_idx`(`user_id`),
    INDEX `carts_guest_session_id_idx`(`guest_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `cart_id` BIGINT NOT NULL,
    `book_variant_id` BIGINT NOT NULL,
    `quantity` INTEGER NOT NULL,
    `added_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cart_items_cart_id_book_variant_id_key`(`cart_id`, `book_variant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(50) NOT NULL,
    `user_id` BIGINT NULL,
    `guest_session_id` CHAR(36) NULL,
    `guest_email` VARCHAR(320) NULL,
    `status` ENUM('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED') NULL,
    `payment_status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND') NULL,
    `subtotal` DECIMAL(12, 2) NULL,
    `discount_amount` DECIMAL(12, 2) NULL,
    `shipping_fee` DECIMAL(12, 2) NULL,
    `total_amount` DECIMAL(12, 2) NULL,
    `currency_code` VARCHAR(3) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `placed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `created_by` BIGINT NULL,
    `updated_by` BIGINT NULL,

    UNIQUE INDEX `orders_order_code_key`(`order_code`),
    UNIQUE INDEX `orders_idempotency_key_key`(`idempotency_key`),
    INDEX `orders_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `orders_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_addresses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
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
CREATE TABLE `order_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `book_variant_id` BIGINT NULL,
    `quantity` INTEGER NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `line_total` DECIMAL(12, 2) NOT NULL,
    `title_snapshot` VARCHAR(500) NOT NULL,
    `format_snapshot` ENUM('HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK') NULL,
    `edition_snapshot` INTEGER NULL,
    `cover_image_url_snapshot` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_items_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_movements` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_variant_id` BIGINT NOT NULL,
    `change_qty` INTEGER NOT NULL,
    `reason` ENUM('PURCHASE', 'RESTOCK', 'ADJUSTMENT', 'RETURN') NOT NULL,
    `ref_type` VARCHAR(50) NULL,
    `ref_id` BIGINT NULL,
    `note` TEXT NULL,
    `created_by` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inventory_movements_book_variant_id_created_at_idx`(`book_variant_id`, `created_at`),
    INDEX `inventory_movements_reason_created_at_idx`(`reason`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
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
CREATE TABLE `payment_transactions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `user_id` BIGINT NULL,
    `gateway` ENUM('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL', 'OTHER') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND') NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency_code` VARCHAR(3) NULL,
    `provider_txn_id` VARCHAR(200) NULL,
    `reference_number` VARCHAR(200) NULL,
    `request_id` VARCHAR(100) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `request_payload` JSON NULL,
    `response_payload` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payment_transactions_order_id_created_at_idx`(`order_id`, `created_at`),
    INDEX `payment_transactions_gateway_provider_txn_id_idx`(`gateway`, `provider_txn_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_inbox` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `gateway` ENUM('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL', 'OTHER') NOT NULL,
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
ALTER TABLE `guest_sessions` ADD CONSTRAINT `guest_sessions_converted_user_id_fkey` FOREIGN KEY (`converted_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE `book_translations` ADD CONSTRAINT `book_translations_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_translations` ADD CONSTRAINT `book_translations_language_id_fkey` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `author_translations` ADD CONSTRAINT `author_translations_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `author_translations` ADD CONSTRAINT `author_translations_language_id_fkey` FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_authors` ADD CONSTRAINT `book_authors_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_authors` ADD CONSTRAINT `book_authors_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_publisher_id_fkey` FOREIGN KEY (`publisher_id`) REFERENCES `publishers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `book_categories` ADD CONSTRAINT `book_categories_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_categories` ADD CONSTRAINT `book_categories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_variants` ADD CONSTRAINT `book_variants_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_variant_snapshots` ADD CONSTRAINT `book_variant_snapshots_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `book_variant_snapshots` ADD CONSTRAINT `book_variant_snapshots_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `book_variant_assets` ADD CONSTRAINT `book_variant_assets_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cart_id_fkey` FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_addresses` ADD CONSTRAINT `order_addresses_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_movements` ADD CONSTRAINT `inventory_movements_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_events` ADD CONSTRAINT `user_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_events` ADD CONSTRAINT `user_events_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_events` ADD CONSTRAINT `user_events_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `user_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `payment_transactions` ADD CONSTRAINT `payment_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

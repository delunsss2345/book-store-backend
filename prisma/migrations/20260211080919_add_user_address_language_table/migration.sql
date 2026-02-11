-- AlterTable
ALTER TABLE `verification_codes` MODIFY `type` ENUM('REGISTER', 'FORGOT_PASSWORD', 'CHANGE_EMAIL', 'CHANGE_PASSWORD') NOT NULL;

-- CreateTable
CREATE TABLE `user_addresses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `address_type` VARCHAR(50) NULL,
    `recipient_name` VARCHAR(200) NULL,
    `phone_number` VARCHAR(30) NOT NULL,
    `address_detail` VARCHAR(255) NOT NULL,
    `ward` VARCHAR(200) NOT NULL,
    `district` VARCHAR(200) NOT NULL,
    `city` VARCHAR(200) NOT NULL,
    `country_code` VARCHAR(2) NOT NULL,
    `is_default` BOOLEAN NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
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
CREATE TABLE `audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `actor_user_id` BIGINT NOT NULL,
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

-- AddForeignKey
ALTER TABLE `user_addresses` ADD CONSTRAINT `user_addresses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

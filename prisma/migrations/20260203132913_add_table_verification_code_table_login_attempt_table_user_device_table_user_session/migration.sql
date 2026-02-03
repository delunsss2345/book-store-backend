/*
  Warnings:

  - You are about to drop the column `created_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `user_role` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `role_permissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `user_role` DROP FOREIGN KEY `user_role_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_role` DROP FOREIGN KEY `user_role_user_id_fkey`;

-- AlterTable
ALTER TABLE `role_permissions` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `created_by`,
    DROP COLUMN `updated_by`;

-- DropTable
DROP TABLE `user_role`;

-- CreateTable
CREATE TABLE `user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `created_by` BIGINT NULL,
    `updated_by` BIGINT NULL,
    `deleted_by` BIGINT NULL,

    INDEX `user_roles_role_id_idx`(`role_id`),
    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_codes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `email` VARCHAR(200) NULL,
    `type` ENUM('REGISTER', 'FORGOT_PASSWORD', 'CHANGE_EMAIL') NOT NULL,
    `code_hash` VARCHAR(200) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_codes_email_type_idx`(`email`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_attempts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `username_or_email` VARCHAR(320) NULL,
    `ip` VARCHAR(64) NULL,
    `user_agent` VARCHAR(1000) NULL,
    `success` BOOLEAN NULL,
    `failure_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_devices` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
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
    `user_id` BIGINT NOT NULL,
    `device_id` BIGINT NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NULL,
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

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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

/*
  Warnings:

  - You are about to drop the `revokedtoken` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `roles` MODIFY `code` ENUM('GUEST', 'ADMIN', 'STAFF', 'CUSTOMER', 'WAREHOUSE') NOT NULL;

-- DropTable
DROP TABLE IF EXISTS `revokedtoken`;
DROP TABLE IF EXISTS `RevokedToken`;

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

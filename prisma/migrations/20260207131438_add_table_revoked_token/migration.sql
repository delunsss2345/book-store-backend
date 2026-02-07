-- CreateTable
CREATE TABLE `RevokedToken` (
    `id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(150) NOT NULL,
    `revoked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RevokedToken_token_hash_key`(`token_hash`),
    INDEX `RevokedToken_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

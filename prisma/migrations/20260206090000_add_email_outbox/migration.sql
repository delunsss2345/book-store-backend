-- CreateTable
CREATE TABLE `email_outbox` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `to_email` VARCHAR(320) NOT NULL,
    `to_name` VARCHAR(200) NULL,
    `subject` VARCHAR(500) NULL,
    `template_key` VARCHAR(200) NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'SENDING', 'SENT', 'FAILED', 'CANCELLED') NULL,
    `scheduled_at` DATETIME(3) NULL,
    `sent_at` DATETIME(3) NULL,
    `attempts` INT NULL,
    `last_error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `email_outbox_status_scheduled_at_idx`(`status`, `scheduled_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

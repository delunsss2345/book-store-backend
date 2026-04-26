-- CreateTable
CREATE TABLE `payment_intents` (
    `id` VARCHAR(191) NOT NULL,
    `order_id` BIGINT NOT NULL,
    `gateway` ENUM('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL', 'SEPAY', 'OTHER') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PAYMENT_SHORTFALL', 'PAYMENT_OVERAGE', 'PARTIAL_REFUND') NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payment_intents_order_id_created_at_idx`(`order_id`, `created_at`),
    INDEX `payment_intents_order_id_gateway_idx`(`order_id`, `gateway`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

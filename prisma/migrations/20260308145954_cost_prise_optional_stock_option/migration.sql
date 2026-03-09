-- AlterTable
ALTER TABLE `book_variants` ADD COLUMN `reserved` INTEGER NULL DEFAULT 0,
    MODIFY `cost_price` DECIMAL(12, 2) NULL;

-- AlterTable
ALTER TABLE `books` ADD COLUMN `supplier_id` BIGINT NULL;

-- CreateTable
CREATE TABLE `supplier` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `supplier_id` on the `books` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `books` DROP FOREIGN KEY `books_publisher_id_fkey`;

-- DropForeignKey
ALTER TABLE `books` DROP FOREIGN KEY `books_supplier_id_fkey`;

-- DropIndex
DROP INDEX `books_publisher_id_fkey` ON `books`;

-- DropIndex
DROP INDEX `books_supplier_id_fkey` ON `books`;

-- AlterTable
ALTER TABLE `books` DROP COLUMN `supplier_id`;

-- CreateTable
CREATE TABLE `stock_import` (
    `id` VARCHAR(191) NOT NULL,
    `supplier_id` BIGINT NOT NULL,
    `created_by` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_import_item` (
    `id` VARCHAR(191) NOT NULL,
    `stock_import_id` VARCHAR(191) NOT NULL,
    `variant_id` BIGINT NOT NULL,
    `quantity` INTEGER NOT NULL,
    `import_price` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_import` ADD CONSTRAINT `stock_import_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `supplier`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_import` ADD CONSTRAINT `stock_import_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_import_item` ADD CONSTRAINT `stock_import_item_stock_import_id_fkey` FOREIGN KEY (`stock_import_id`) REFERENCES `stock_import`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_import_item` ADD CONSTRAINT `stock_import_item_variant_id_fkey` FOREIGN KEY (`variant_id`) REFERENCES `book_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

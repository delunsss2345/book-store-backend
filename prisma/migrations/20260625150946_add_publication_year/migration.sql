/*
  Warnings:

  - You are about to drop the column `bookVariantId` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseOrderId` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `purchase_order_items` table. All the data in the column will be lost.
  - Added the required column `book_variant_id` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount_price` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchase_order_id` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `purchase_order_items` DROP FOREIGN KEY `purchase_order_items_bookVariantId_fkey`;

-- DropForeignKey
ALTER TABLE `purchase_order_items` DROP FOREIGN KEY `purchase_order_items_purchaseOrderId_fkey`;

-- DropIndex
DROP INDEX `purchase_order_items_bookVariantId_fkey` ON `purchase_order_items`;

-- DropIndex
DROP INDEX `purchase_order_items_purchaseOrderId_fkey` ON `purchase_order_items`;

-- AlterTable
ALTER TABLE `book_variants` ADD COLUMN `publication_year` INTEGER NULL;

-- AlterTable
ALTER TABLE `purchase_order_items` DROP COLUMN `bookVariantId`,
    DROP COLUMN `purchaseOrderId`,
    DROP COLUMN `totalPrice`,
    DROP COLUMN `unitPrice`,
    ADD COLUMN `book_variant_id` INTEGER NOT NULL,
    ADD COLUMN `discount_price` DECIMAL(18, 2) NOT NULL,
    ADD COLUMN `price` DECIMAL(18, 2) NOT NULL,
    ADD COLUMN `purchase_order_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `total_price` DECIMAL(18, 2) NOT NULL,
    ADD COLUMN `unit_price` DECIMAL(18, 2) NOT NULL;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

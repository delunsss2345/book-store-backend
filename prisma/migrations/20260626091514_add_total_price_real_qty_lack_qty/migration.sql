/*
  Warnings:

  - You are about to drop the column `supplier_id` on the `stock_import` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `stock_import` table. All the data in the column will be lost.
  - You are about to drop the column `import_price` on the `stock_import_item` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `stock_import_item` table. All the data in the column will be lost.
  - You are about to drop the column `variant_id` on the `stock_import_item` table. All the data in the column will be lost.
  - Made the column `purchase_order_id` on table `stock_import` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `purchase_order_item_id` to the `stock_import_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `real_quantity` to the `stock_import_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `stock_import_item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `stock_import` DROP FOREIGN KEY `stock_import_purchase_order_id_fkey`;

-- DropForeignKey
ALTER TABLE `stock_import` DROP FOREIGN KEY `stock_import_supplier_id_fkey`;

-- DropForeignKey
ALTER TABLE `stock_import_item` DROP FOREIGN KEY `stock_import_item_variant_id_fkey`;

-- DropIndex
DROP INDEX `stock_import_supplier_id_fkey` ON `stock_import`;

-- DropIndex
DROP INDEX `stock_import_item_variant_id_fkey` ON `stock_import_item`;

-- AlterTable
ALTER TABLE `purchase_orders` ADD COLUMN `status_transfer` ENUM('PENDING', 'PROCESSING', 'PURCHASE', 'RETURN') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `update_transfer_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `stock_import` DROP COLUMN `supplier_id`,
    DROP COLUMN `taxAmount`,
    MODIFY `purchase_order_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `stock_import_item` DROP COLUMN `import_price`,
    DROP COLUMN `quantity`,
    DROP COLUMN `variant_id`,
    ADD COLUMN `lack_quantity` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `purchase_order_item_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `real_quantity` INTEGER NOT NULL,
    ADD COLUMN `total_price` DECIMAL(18, 2) NOT NULL;

-- AddForeignKey
ALTER TABLE `stock_import` ADD CONSTRAINT `stock_import_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_update_transfer_id_fkey` FOREIGN KEY (`update_transfer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

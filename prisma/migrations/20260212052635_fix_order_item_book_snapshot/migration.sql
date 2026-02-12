/*
  Warnings:

  - You are about to drop the column `order_item_id` on the `book_variant_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `book_variant_id` on the `order_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[book_variant_snapshot_id]` on the table `order_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cost_price` to the `book_variants` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `book_variant_snapshots` DROP FOREIGN KEY `book_variant_snapshots_book_variant_id_fkey`;

-- DropForeignKey
ALTER TABLE `book_variant_snapshots` DROP FOREIGN KEY `book_variant_snapshots_order_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_book_variant_id_fkey`;

-- DropIndex
DROP INDEX `book_variant_snapshots_order_item_id_key` ON `book_variant_snapshots`;

-- DropIndex
DROP INDEX `idx_bvs_order_item_id` ON `book_variant_snapshots`;

-- DropIndex
DROP INDEX `order_items_book_variant_id_fkey` ON `order_items`;

-- AlterTable
ALTER TABLE `book_variant_snapshots` DROP COLUMN `order_item_id`,
    MODIFY `book_variant_id` BIGINT NULL;

-- AlterTable
ALTER TABLE `book_variants` ADD COLUMN `cost_price` DECIMAL(12, 2) NOT NULL;

-- AlterTable
ALTER TABLE `order_items` DROP COLUMN `book_variant_id`,
    ADD COLUMN `book_variant_snapshot_id` BIGINT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `order_items_book_variant_snapshot_id_key` ON `order_items`(`book_variant_snapshot_id`);

-- AddForeignKey
ALTER TABLE `book_variant_snapshots` ADD CONSTRAINT `book_variant_snapshots_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_book_variant_snapshot_id_fkey` FOREIGN KEY (`book_variant_snapshot_id`) REFERENCES `book_variant_snapshots`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

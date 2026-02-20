/*
  Warnings:

  - You are about to drop the column `cover_image_url_snapshot` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `edition_snapshot` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `format_snapshot` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `title_snapshot` on the `order_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[content_hash]` on the table `book_variant_snapshots` will be added. If there are existing duplicate values, this will fail.
  - Made the column `book_variant_snapshot_id` on table `order_items` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_book_variant_snapshot_id_fkey`;

-- DropIndex
DROP INDEX `order_items_book_variant_snapshot_id_key` ON `order_items`;

-- AlterTable
ALTER TABLE `book_variant_snapshots` ADD COLUMN `content_hash` VARCHAR(255) NULL,
    ADD COLUMN `cover_image_url_snapshot` TEXT NULL,
    ADD COLUMN `title_snapshot` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `order_items` DROP COLUMN `cover_image_url_snapshot`,
    DROP COLUMN `edition_snapshot`,
    DROP COLUMN `format_snapshot`,
    DROP COLUMN `title_snapshot`,
    MODIFY `book_variant_snapshot_id` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `payment_transactions` MODIFY `gateway` ENUM('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL', 'SEPAY', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `webhook_inbox` MODIFY `gateway` ENUM('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL', 'SEPAY', 'OTHER') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `book_variant_snapshots_content_hash_key` ON `book_variant_snapshots`(`content_hash`);

-- CreateIndex
CREATE INDEX `order_items_book_variant_snapshot_id_idx` ON `order_items`(`book_variant_snapshot_id`);

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_book_variant_snapshot_id_fkey` FOREIGN KEY (`book_variant_snapshot_id`) REFERENCES `book_variant_snapshots`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `wishlists` ADD CONSTRAINT `wishlists_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

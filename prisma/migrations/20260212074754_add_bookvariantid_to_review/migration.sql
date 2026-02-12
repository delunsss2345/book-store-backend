/*
  Warnings:

  - Made the column `book_variant_id` on table `book_variant_snapshots` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `book_variant_id` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `book_variant_snapshots` DROP FOREIGN KEY `book_variant_snapshots_book_variant_id_fkey`;

-- AlterTable
ALTER TABLE `book_variant_snapshots` MODIFY `book_variant_id` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `book_variant_id` BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE `book_variant_snapshots` ADD CONSTRAINT `book_variant_snapshots_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_book_variant_id_fkey` FOREIGN KEY (`book_variant_id`) REFERENCES `book_variants`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

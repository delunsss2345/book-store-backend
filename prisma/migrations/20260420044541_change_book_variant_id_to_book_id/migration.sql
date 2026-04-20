/*
  Warnings:

  - You are about to drop the column `book_variant_id` on the `book_variant_assets` table. All the data in the column will be lost.
  - Added the required column `book_id` to the `book_variant_assets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `book_variant_assets` DROP FOREIGN KEY `book_variant_assets_book_variant_id_fkey`;

-- DropIndex
DROP INDEX `book_variant_assets_book_variant_id_fkey` ON `book_variant_assets`;

-- AlterTable
ALTER TABLE `book_variant_assets` DROP COLUMN `book_variant_id`,
    ADD COLUMN `book_id` BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE `book_variant_assets` ADD CONSTRAINT `book_variant_assets_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

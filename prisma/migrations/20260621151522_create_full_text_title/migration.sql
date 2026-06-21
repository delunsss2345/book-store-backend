/*
  Warnings:

  - Made the column `address_type` on table `user_addresses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user_addresses` MODIFY `address_type` ENUM('HOME', 'WORK', 'OTHER') NOT NULL DEFAULT 'HOME';

-- CreateIndex
CREATE FULLTEXT INDEX `idx_book_translation_fulltext` ON `book_translations`(`title`, `description`);

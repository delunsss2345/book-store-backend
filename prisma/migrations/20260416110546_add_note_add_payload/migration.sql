/*
  Warnings:

  - Made the column `available` on table `book_variants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recipient_name` on table `user_addresses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `book_variants` MODIFY `available` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `email_outbox` ADD COLUMN `payload` JSON NULL;

-- AlterTable
ALTER TABLE `user_addresses` MODIFY `recipient_name` VARCHAR(200) NOT NULL;

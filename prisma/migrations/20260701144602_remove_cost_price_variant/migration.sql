/*
  Warnings:

  - You are about to drop the column `cost_price` on the `book_variants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `book_variants` DROP COLUMN `cost_price`;

-- AlterTable
ALTER TABLE `orders` MODIFY `placed_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

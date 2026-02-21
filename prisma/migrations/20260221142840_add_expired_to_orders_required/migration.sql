/*
  Warnings:

  - Made the column `expired_at` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `orders` MODIFY `expired_at` DATETIME(3) NOT NULL;

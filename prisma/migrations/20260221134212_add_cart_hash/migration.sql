/*
  Warnings:

  - A unique constraint covering the columns `[cart_hash]` on the table `carts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `carts` ADD COLUMN `cart_hash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `carts_cart_hash_key` ON `carts`(`cart_hash`);

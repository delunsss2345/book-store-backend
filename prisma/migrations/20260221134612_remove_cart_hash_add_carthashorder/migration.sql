/*
  Warnings:

  - You are about to drop the column `cart_hash` on the `carts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cart_hash]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `carts_cart_hash_key` ON `carts`;

-- AlterTable
ALTER TABLE `carts` DROP COLUMN `cart_hash`;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `cart_hash` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `orders_cart_hash_key` ON `orders`(`cart_hash`);

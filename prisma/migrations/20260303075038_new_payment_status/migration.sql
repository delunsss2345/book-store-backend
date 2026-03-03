/*
  Warnings:

  - You are about to alter the column `default_name` on the `publishers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(300)` to `VarChar(255)`.
  - A unique constraint covering the columns `[default_name]` on the table `authors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[default_name]` on the table `publishers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `orders` MODIFY `payment_status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PAYMENT_SHORTFALL', 'PAYMENT_OVERAGE', 'PARTIAL_REFUND') NULL;

-- AlterTable
ALTER TABLE `payment_transactions` MODIFY `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PAYMENT_SHORTFALL', 'PAYMENT_OVERAGE', 'PARTIAL_REFUND') NULL;

-- AlterTable
ALTER TABLE `publishers` MODIFY `default_name` VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `authors_default_name_key` ON `authors`(`default_name`);

-- CreateIndex
CREATE UNIQUE INDEX `publishers_default_name_key` ON `publishers`(`default_name`);

/*
  Warnings:

  - You are about to drop the column `real_pay_price` on the `purchase_order_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `purchase_order_items` DROP COLUMN `real_pay_price`;

-- AlterTable
ALTER TABLE `purchase_orders` ADD COLUMN `real_pay_price` DECIMAL(18, 2) NULL;

/*
  Warnings:

  - Added the required column `order_code` to the `payment_intents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payment_intents` ADD COLUMN `order_code` VARCHAR(50) NOT NULL;

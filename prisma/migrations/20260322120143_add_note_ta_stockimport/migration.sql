/*
  Warnings:

  - Added the required column `taxAmount` to the `stock_import` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `stock_import` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `stock_import` ADD COLUMN `note` VARCHAR(191) NULL,
    ADD COLUMN `taxAmount` DECIMAL(18, 2) NOT NULL,
    ADD COLUMN `totalAmount` DECIMAL(18, 2) NOT NULL;

/*
  Warnings:

  - You are about to drop the column `country_code` on the `user_addresses` table. All the data in the column will be lost.
  - Made the column `code` on table `permissions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `permissions` MODIFY `code` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `user_addresses` DROP COLUMN `country_code`;

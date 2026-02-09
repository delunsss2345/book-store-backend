/*
  Warnings:

  - You are about to drop the column `payload` on the `email_outbox` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `email_outbox` DROP COLUMN `payload`;

-- AlterTable
ALTER TABLE `verification_codes` MODIFY `code_hash` VARCHAR(200) NULL;

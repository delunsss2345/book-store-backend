/*
  Warnings:

  - You are about to alter the column `code` on the `roles` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `roles` MODIFY `code` ENUM('GUEST', 'ADMIN', 'STAFF') NOT NULL;

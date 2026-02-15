/*
  Warnings:

  - You are about to alter the column `code` on the `book_badges` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(7))`.

*/
-- AlterTable
ALTER TABLE `book_badges` MODIFY `code` ENUM('NEW', 'LIMITED', 'BESTSELLER', 'EDITION') NOT NULL;

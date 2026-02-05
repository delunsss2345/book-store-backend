/*
  Warnings:

  - You are about to drop the column `update_by_id` on the `permissions` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Made the column `status` on table `user_sessions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `permissions` DROP FOREIGN KEY `permissions_update_by_id_fkey`;

-- DropIndex
DROP INDEX `permissions_update_by_id_fkey` ON `permissions`;

-- DropIndex
DROP INDEX `users_username_key` ON `users`;

-- AlterTable
ALTER TABLE `permissions` DROP COLUMN `update_by_id`,
    ADD COLUMN `updated_by_id` BIGINT NULL;

-- AlterTable
ALTER TABLE `user_sessions` MODIFY `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `users` DROP COLUMN `username`;

-- CreateIndex
CREATE UNIQUE INDEX `roles_code_key` ON `roles`(`code`);

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

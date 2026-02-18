-- DropForeignKey
ALTER TABLE `wishlists` DROP FOREIGN KEY `wishlists_guest_session_id_fkey`;

-- DropForeignKey
ALTER TABLE `wishlists` DROP FOREIGN KEY `wishlists_user_id_fkey`;

-- DropIndex
DROP INDEX `wishlists_guest_session_id_key` ON `wishlists`;

-- DropIndex
DROP INDEX `wishlists_user_id_key` ON `wishlists`;

-- AlterTable
ALTER TABLE `wishlists` ADD COLUMN `delete_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `address_id` BIGINT NULL;

-- AlterTable
ALTER TABLE `payment_transactions` ADD COLUMN `payment_url` VARCHAR(100) NULL;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `user_addresses`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

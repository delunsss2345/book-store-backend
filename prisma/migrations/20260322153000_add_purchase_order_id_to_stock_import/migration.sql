-- AlterTable
ALTER TABLE `stock_import`
    ADD COLUMN `purchase_order_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `stock_import_purchase_order_id_key` ON `stock_import`(`purchase_order_id`);

-- AddForeignKey
ALTER TABLE `stock_import`
    ADD CONSTRAINT `stock_import_purchase_order_id_fkey`
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

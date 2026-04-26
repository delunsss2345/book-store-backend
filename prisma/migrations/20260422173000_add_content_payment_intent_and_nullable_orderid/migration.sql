-- AlterTable
ALTER TABLE `payment_intents`
  ADD COLUMN `content` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payment_intents_content_key` ON `payment_intents`(`content`);

-- AlterTable
ALTER TABLE `payment_transactions`
  MODIFY `order_id` BIGINT NULL;

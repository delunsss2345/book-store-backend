/*
  Warnings:

  - You are about to drop the column `order_id` on the `payment_intents` table. All the data in the column will be lost.
  - You are about to drop the column `idempotency_key` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payment_url` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `provider_txn_id` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reference_number` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `request_id` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `request_payload` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `response_payload` on the `payment_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `last_error` on the `webhook_inbox` table. All the data in the column will be lost.
  - You are about to drop the column `provider_event_id` on the `webhook_inbox` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order_code]` on the table `payment_intents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gateway,webhook_id]` on the table `webhook_inbox` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `webhook_id` to the `webhook_inbox` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `payment_intents` DROP FOREIGN KEY `payment_intents_order_id_fkey`;

-- DropIndex
DROP INDEX `payment_intents_order_id_created_at_idx` ON `payment_intents`;

-- DropIndex
DROP INDEX `payment_intents_order_id_gateway_idx` ON `payment_intents`;

-- DropIndex
DROP INDEX `payment_transactions_gateway_provider_txn_id_idx` ON `payment_transactions`;

-- DropIndex
DROP INDEX `webhook_inbox_gateway_provider_event_id_key` ON `webhook_inbox`;

-- AlterTable
ALTER TABLE `payment_intents` DROP COLUMN `order_id`,
    MODIFY `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PAYMENT_SHORTFALL', 'PAYMENT_OVERAGE', 'PARTIAL_REFUND', 'EXPIRED', 'NOT_FOUND_ORDER_CODE') NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `payment_transactions` DROP COLUMN `idempotency_key`,
    DROP COLUMN `payment_url`,
    DROP COLUMN `provider_txn_id`,
    DROP COLUMN `reference_number`,
    DROP COLUMN `request_id`,
    DROP COLUMN `request_payload`,
    DROP COLUMN `response_payload`,
    MODIFY `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PAYMENT_SHORTFALL', 'PAYMENT_OVERAGE', 'PARTIAL_REFUND', 'EXPIRED', 'NOT_FOUND_ORDER_CODE') NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `webhook_inbox` DROP COLUMN `last_error`,
    DROP COLUMN `provider_event_id`,
    ADD COLUMN `webhook_id` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payment_intents_order_code_key` ON `payment_intents`(`order_code`);

-- CreateIndex
CREATE INDEX `payment_intents_order_code_created_at_idx` ON `payment_intents`(`order_code`, `created_at`);

-- CreateIndex
CREATE INDEX `payment_intents_order_code_gateway_idx` ON `payment_intents`(`order_code`, `gateway`);

-- CreateIndex
CREATE UNIQUE INDEX `webhook_inbox_gateway_webhook_id_key` ON `webhook_inbox`(`gateway`, `webhook_id`);

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_order_code_fkey` FOREIGN KEY (`order_code`) REFERENCES `orders`(`order_code`) ON DELETE CASCADE ON UPDATE NO ACTION;

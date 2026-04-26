/*
  Warnings:

  - A unique constraint covering the columns `[token_url]` on the table `payment_intents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token_url` to the `payment_intents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payment_intents` ADD COLUMN `token_url` VARCHAR(200) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payment_intents_token_url_key` ON `payment_intents`(`token_url`);

/*
  Warnings:

  - You are about to drop the column `cover_image_url_snapshot` on the `book_variant_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `edition_snapshot` on the `book_variant_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `sku_snapshot` on the `book_variant_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `title_snapshot` on the `book_variant_snapshots` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `book_variant_snapshots` DROP COLUMN `cover_image_url_snapshot`,
    DROP COLUMN `edition_snapshot`,
    DROP COLUMN `sku_snapshot`,
    DROP COLUMN `title_snapshot`;

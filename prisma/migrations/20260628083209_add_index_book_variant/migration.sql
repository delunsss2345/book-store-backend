-- CreateIndex
CREATE INDEX `book_variants_isbn_idx` ON `book_variants`(`isbn`);

-- CreateIndex
CREATE INDEX `book_variants_book_id_format_idx` ON `book_variants`(`book_id`, `format`);

-- CreateIndex
CREATE INDEX `book_variants_book_id_idx` ON `book_variants`(`book_id`);

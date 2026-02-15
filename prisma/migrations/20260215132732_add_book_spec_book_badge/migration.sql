-- CreateTable
CREATE TABLE `book_specs` (
    `book_id` BIGINT NOT NULL,
    `width_cm` DECIMAL(6, 2) NULL,
    `height_cm` DECIMAL(6, 2) NULL,
    `thickness_cm` DECIMAL(6, 2) NULL,
    `packaging` VARCHAR(200) NULL,

    PRIMARY KEY (`book_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_badges` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_id` BIGINT NOT NULL,
    `code` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `book_badges_book_id_key`(`book_id`),
    INDEX `book_badges_book_id_code_idx`(`book_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `book_specs` ADD CONSTRAINT `book_specs_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `book_badges` ADD CONSTRAINT `book_badges_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

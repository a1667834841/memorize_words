-- CreateTable
CREATE TABLE `words` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(255) NOT NULL,
    `translation` TEXT NOT NULL,
    `type` VARCHAR(50) NULL,

    INDEX `words_word_idx`(`word`),
    INDEX `words_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phrases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(255) NOT NULL,
    `phrase` VARCHAR(255) NOT NULL,
    `translation` TEXT NOT NULL,

    INDEX `phrases_word_phrase_idx`(`word`, `phrase`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_words` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(255) NOT NULL,
    `translation` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NULL,
    `date` DATE NOT NULL,

    INDEX `daily_words_date_idx`(`date`),
    UNIQUE INDEX `daily_words_word_date_key`(`word`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

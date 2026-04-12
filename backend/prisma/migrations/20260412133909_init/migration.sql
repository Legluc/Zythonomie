-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `firstname` VARCHAR(50) NOT NULL,
    `mail` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `birthday` DATE NOT NULL,
    `adress` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(255) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',

    UNIQUE INDEX `user_mail_key`(`mail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brewery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `origin_date` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `alcool` BOOLEAN NOT NULL,
    `percentage_alcool` DECIMAL(5, 2) NOT NULL,
    `EAN` INTEGER NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beer_by_brewery` (
    `id_brewery` INTEGER NOT NULL,
    `id_beer` INTEGER NOT NULL,

    PRIMARY KEY (`id_brewery`, `id_beer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rating` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `id_beer` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `rate` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beer_recommended_user` (
    `id_user` INTEGER NOT NULL,
    `id_beer` INTEGER NOT NULL,
    `score_compatibility` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`id_user`, `id_beer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `criterion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_criterias` (
    `id_user` INTEGER NOT NULL,
    `id_criterion` INTEGER NOT NULL,
    `score` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`id_user`, `id_criterion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beer_criterias` (
    `id_criterion` INTEGER NOT NULL,
    `id_beer` INTEGER NOT NULL,
    `score` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`id_criterion`, `id_beer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quizz` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quizz_question` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_criterion` INTEGER NOT NULL,
    `id_quizz` INTEGER NOT NULL,
    `question` VARCHAR(150) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_choice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_quizz_question` INTEGER NOT NULL,
    `choice` VARCHAR(100) NOT NULL,
    `note_value` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quizz_session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user` INTEGER NOT NULL,
    `id_quizz` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'COMPLETED', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `answer_user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_quizz_session` INTEGER NOT NULL,
    `id_question_choice` INTEGER NOT NULL,
    `answered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_parent_category` INTEGER NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beer_by_category` (
    `id_beer` INTEGER NOT NULL,
    `id_category` INTEGER NOT NULL,

    PRIMARY KEY (`id_beer`, `id_category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pairing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pairing_by_category` (
    `id_pairing` INTEGER NOT NULL,
    `id_category` INTEGER NOT NULL,

    PRIMARY KEY (`id_pairing`, `id_category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `beer_by_brewery` ADD CONSTRAINT `beer_by_brewery_id_brewery_fkey` FOREIGN KEY (`id_brewery`) REFERENCES `brewery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beer_by_brewery` ADD CONSTRAINT `beer_by_brewery_id_beer_fkey` FOREIGN KEY (`id_beer`) REFERENCES `beer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rating` ADD CONSTRAINT `rating_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rating` ADD CONSTRAINT `rating_id_beer_fkey` FOREIGN KEY (`id_beer`) REFERENCES `beer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beer_recommended_user` ADD CONSTRAINT `beer_recommended_user_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beer_recommended_user` ADD CONSTRAINT `beer_recommended_user_id_beer_fkey` FOREIGN KEY (`id_beer`) REFERENCES `beer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_criterias` ADD CONSTRAINT `user_criterias_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_criterias` ADD CONSTRAINT `user_criterias_id_criterion_fkey` FOREIGN KEY (`id_criterion`) REFERENCES `criterion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beer_criterias` ADD CONSTRAINT `beer_criterias_id_criterion_fkey` FOREIGN KEY (`id_criterion`) REFERENCES `criterion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beer_criterias` ADD CONSTRAINT `beer_criterias_id_beer_fkey` FOREIGN KEY (`id_beer`) REFERENCES `beer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizz_question` ADD CONSTRAINT `quizz_question_id_criterion_fkey` FOREIGN KEY (`id_criterion`) REFERENCES `criterion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizz_question` ADD CONSTRAINT `quizz_question_id_quizz_fkey` FOREIGN KEY (`id_quizz`) REFERENCES `quizz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_choice` ADD CONSTRAINT `question_choice_id_quizz_question_fkey` FOREIGN KEY (`id_quizz_question`) REFERENCES `quizz_question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizz_session` ADD CONSTRAINT `quizz_session_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quizz_session` ADD CONSTRAINT `quizz_session_id_quizz_fkey` FOREIGN KEY (`id_quizz`) REFERENCES `quizz`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answer_user` ADD CONSTRAINT `answer_user_id_quizz_session_fkey` FOREIGN KEY (`id_quizz_session`) REFERENCES `quizz_session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `answer_user` ADD CONSTRAINT `answer_user_id_question_choice_fkey` FOREIGN KEY (`id_question_choice`) REFERENCES `question_choice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category` ADD CONSTRAINT `category_id_parent_category_fkey` FOREIGN KEY (`id_parent_category`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beer_by_category` ADD CONSTRAINT `beer_by_category_id_beer_fkey` FOREIGN KEY (`id_beer`) REFERENCES `beer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beer_by_category` ADD CONSTRAINT `beer_by_category_id_category_fkey` FOREIGN KEY (`id_category`) REFERENCES `category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pairing_by_category` ADD CONSTRAINT `pairing_by_category_id_pairing_fkey` FOREIGN KEY (`id_pairing`) REFERENCES `pairing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pairing_by_category` ADD CONSTRAINT `pairing_by_category_id_category_fkey` FOREIGN KEY (`id_category`) REFERENCES `category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

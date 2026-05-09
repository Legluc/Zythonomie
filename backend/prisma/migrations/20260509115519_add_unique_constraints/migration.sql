/*
  Warnings:

  - A unique constraint covering the columns `[EAN]` on the table `beer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `brewery` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `criterion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `pairing` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `quizz` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `beer_EAN_key` ON `beer`(`EAN`);

-- CreateIndex
CREATE UNIQUE INDEX `brewery_name_key` ON `brewery`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `category_name_key` ON `category`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `criterion_name_key` ON `criterion`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `pairing_name_key` ON `pairing`(`name`);

-- CreateIndex
CREATE UNIQUE INDEX `quizz_name_key` ON `quizz`(`name`);

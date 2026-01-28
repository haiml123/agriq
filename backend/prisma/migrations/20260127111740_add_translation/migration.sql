/*
  Warnings:

  - You are about to drop the column `last_battery` on the `gateway` table. All the data in the column will be lost.
  - You are about to drop the column `last_humidity` on the `gateway` table. All the data in the column will be lost.
  - You are about to drop the column `last_reading_at` on the `gateway` table. All the data in the column will be lost.
  - You are about to drop the column `last_temperature` on the `gateway` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cell" ALTER COLUMN "height" DROP DEFAULT,
ALTER COLUMN "length" DROP DEFAULT,
ALTER COLUMN "width" DROP DEFAULT;

-- AlterTable
ALTER TABLE "gateway" DROP COLUMN "last_battery",
DROP COLUMN "last_humidity",
DROP COLUMN "last_reading_at",
DROP COLUMN "last_temperature";

-- CreateTable
CREATE TABLE "translation" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "translation_entity_entity_id_idx" ON "translation"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "translation_entity_locale_idx" ON "translation"("entity", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "translation_entity_entity_id_field_locale_key" ON "translation"("entity", "entity_id", "field", "locale");

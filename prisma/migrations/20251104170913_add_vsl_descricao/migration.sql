/*
  Warnings:

  - You are about to drop the column `cpc` on the `Oferta` table. All the data in the column will be lost.
  - You are about to drop the column `cpm` on the `Oferta` table. All the data in the column will be lost.
  - You are about to drop the column `ctr` on the `Oferta` table. All the data in the column will be lost.
  - You are about to drop the column `roi` on the `Oferta` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Oferta_isActive_ctr_idx";

-- DropIndex
DROP INDEX "Oferta_isActive_roi_idx";

-- AlterTable
ALTER TABLE "Oferta" DROP COLUMN "cpc",
DROP COLUMN "cpm",
DROP COLUMN "ctr",
DROP COLUMN "roi",
ADD COLUMN     "vslDescricao" TEXT;

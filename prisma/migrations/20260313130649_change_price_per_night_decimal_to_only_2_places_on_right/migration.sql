/*
  Warnings:

  - You are about to alter the column `pricePerNight` on the `Room` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "pricePerNight" SET DATA TYPE DECIMAL(12,2);

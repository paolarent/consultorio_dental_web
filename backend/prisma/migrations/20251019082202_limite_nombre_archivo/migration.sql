/*
  Warnings:

  - You are about to alter the column `nombre` on the `archivo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(40)`.

*/
-- AlterTable
ALTER TABLE "archivo" ALTER COLUMN "nombre" SET DATA TYPE VARCHAR(40);

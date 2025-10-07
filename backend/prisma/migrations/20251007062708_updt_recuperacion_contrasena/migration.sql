/*
  Warnings:

  - You are about to drop the column `token_hash` on the `recuperacion_contraseña` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recuperacion_contraseña" DROP COLUMN "token_hash";

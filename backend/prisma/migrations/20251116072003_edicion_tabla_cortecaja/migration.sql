/*
  Warnings:

  - Added the required column `id_consultorio` to the `corte_caja` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "corte_caja" ADD COLUMN     "id_consultorio" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "corte_caja" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE CASCADE ON UPDATE CASCADE;

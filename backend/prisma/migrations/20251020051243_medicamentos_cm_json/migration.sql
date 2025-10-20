/*
  Warnings:

  - Changed the type of `medicamentos_actuales` on the `condicion_medica` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "condicion_medica" DROP COLUMN "medicamentos_actuales",
ADD COLUMN     "medicamentos_actuales" JSONB NOT NULL;

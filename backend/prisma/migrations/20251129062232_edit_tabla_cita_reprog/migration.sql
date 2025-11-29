/*
  Warnings:

  - Added the required column `hora_fin` to the `cita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hora_fin_original` to the `reprogramacion_cita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nueva_hora_fin` to the `reprogramacion_cita` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cita" ADD COLUMN     "hora_fin" TIME(0) NOT NULL,
ALTER COLUMN "hora_inicio" SET DATA TYPE TIME(0);

-- AlterTable
ALTER TABLE "reprogramacion_cita" ADD COLUMN     "hora_fin_original" TIME(0) NOT NULL,
ADD COLUMN     "nueva_hora_fin" TIME(0) NOT NULL,
ALTER COLUMN "hora_original" SET DATA TYPE TIME(0),
ALTER COLUMN "nueva_hora" SET DATA TYPE TIME(0);

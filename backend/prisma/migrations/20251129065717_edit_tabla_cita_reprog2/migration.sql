-- AlterTable
ALTER TABLE "cita" ALTER COLUMN "hora_inicio" SET DATA TYPE TIMETZ(6),
ALTER COLUMN "hora_fin" SET DATA TYPE TIMETZ(6);

-- AlterTable
ALTER TABLE "reprogramacion_cita" ALTER COLUMN "hora_original" SET DATA TYPE TIMETZ(6),
ALTER COLUMN "nueva_hora" SET DATA TYPE TIMETZ(6),
ALTER COLUMN "hora_fin_original" SET DATA TYPE TIMETZ(6),
ALTER COLUMN "nueva_hora_fin" SET DATA TYPE TIMETZ(6);

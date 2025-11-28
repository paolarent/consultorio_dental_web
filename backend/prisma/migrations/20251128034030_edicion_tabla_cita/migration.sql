-- AlterTable
ALTER TABLE "cita" ADD COLUMN     "id_servicio" INTEGER,
ALTER COLUMN "id_motivo" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "id_servicio" FOREIGN KEY ("id_servicio") REFERENCES "servicio"("id_servicio") ON DELETE CASCADE ON UPDATE CASCADE;

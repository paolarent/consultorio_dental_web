-- AddForeignKey
ALTER TABLE "motivo_consulta" ADD CONSTRAINT "motivo_consulta_id_servicio_fkey" FOREIGN KEY ("id_servicio") REFERENCES "servicio"("id_servicio") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[id_usuario]` on the table `paciente` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "paciente_id_usuario_key" ON "paciente"("id_usuario");

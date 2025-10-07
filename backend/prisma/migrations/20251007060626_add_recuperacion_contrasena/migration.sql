/*
  Warnings:

  - You are about to drop the column `expira_token` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `token_recuperacion` on the `usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "expira_token",
DROP COLUMN "token_recuperacion";

-- CreateTable
CREATE TABLE "recuperacion_contraseña" (
    "id_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "fecha_expira" TIMESTAMPTZ(6) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_solicitud" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recuperacion_contraseña_pkey" PRIMARY KEY ("id_token")
);

-- CreateIndex
CREATE UNIQUE INDEX "recuperacion_contraseña_token_key" ON "recuperacion_contraseña"("token");

-- AddForeignKey
ALTER TABLE "recuperacion_contraseña" ADD CONSTRAINT "recuperacion_contraseña_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

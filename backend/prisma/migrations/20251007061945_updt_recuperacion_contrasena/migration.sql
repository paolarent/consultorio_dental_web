/*
  Warnings:

  - The primary key for the `recuperacion_contraseña` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fecha_expira` on the `recuperacion_contraseña` table. All the data in the column will be lost.
  - You are about to drop the column `id_token` on the `recuperacion_contraseña` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `recuperacion_contraseña` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."recuperacion_contraseña_token_key";

-- AlterTable
ALTER TABLE "recuperacion_contraseña" DROP CONSTRAINT "recuperacion_contraseña_pkey",
DROP COLUMN "fecha_expira",
DROP COLUMN "id_token",
DROP COLUMN "token",
ADD COLUMN     "fecha_uso" TIMESTAMP(3),
ADD COLUMN     "id_recuperacion" SERIAL NOT NULL,
ADD COLUMN     "token_hash" VARCHAR(255),
ALTER COLUMN "fecha_solicitud" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "recuperacion_contraseña_pkey" PRIMARY KEY ("id_recuperacion");

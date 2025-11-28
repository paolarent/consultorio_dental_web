/*
  Warnings:

  - The values [programada] on the enum `status_cita_reprog` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "status_cita_reprog_new" AS ENUM ('aceptada', 'pendiente', 'cancelada');
ALTER TABLE "reprogramacion_cita" ALTER COLUMN "status" TYPE "status_cita_reprog_new" USING ("status"::text::"status_cita_reprog_new");
ALTER TYPE "status_cita_reprog" RENAME TO "status_cita_reprog_old";
ALTER TYPE "status_cita_reprog_new" RENAME TO "status_cita_reprog";
DROP TYPE "public"."status_cita_reprog_old";
COMMIT;

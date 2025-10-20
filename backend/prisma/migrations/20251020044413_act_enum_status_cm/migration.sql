/*
  Warnings:

  - The values [resuelta] on the enum `status_condicion_med` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "status_condicion_med_new" AS ENUM ('activa', 'descartada', 'cronica');
ALTER TABLE "condicion_medica" ALTER COLUMN "status" TYPE "status_condicion_med_new" USING ("status"::text::"status_condicion_med_new");
ALTER TYPE "status_condicion_med" RENAME TO "status_condicion_med_old";
ALTER TYPE "status_condicion_med_new" RENAME TO "status_condicion_med";
DROP TYPE "public"."status_condicion_med_old";
COMMIT;

/*
  Warnings:

  - You are about to drop the `cargo_adicional` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."cargo_adicional" DROP CONSTRAINT "cargo_adicional_id_ingreso_fkey";

-- DropTable
DROP TABLE "public"."cargo_adicional";

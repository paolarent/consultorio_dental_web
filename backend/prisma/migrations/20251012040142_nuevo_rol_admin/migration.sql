-- AlterEnum
ALTER TYPE "rol" ADD VALUE 'admin';

-- AlterTable
ALTER TABLE "consultorio" ALTER COLUMN "titular_ap2" DROP NOT NULL;

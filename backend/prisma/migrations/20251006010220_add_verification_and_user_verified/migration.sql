-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "correo_verificado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "verificacion_correo" (
    "id_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nuevo_correo" VARCHAR(255),
    "token" TEXT NOT NULL,
    "fecha_expira" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verificacion_correo_pkey" PRIMARY KEY ("id_token")
);

-- CreateIndex
CREATE UNIQUE INDEX "verificacion_correo_token_key" ON "verificacion_correo"("token");

-- AddForeignKey
ALTER TABLE "verificacion_correo" ADD CONSTRAINT "verificacion_correo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

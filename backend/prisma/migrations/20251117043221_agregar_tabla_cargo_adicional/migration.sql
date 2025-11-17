-- CreateTable
CREATE TABLE "cargo_adicional" (
    "id_cargo_adicional" SERIAL NOT NULL,
    "id_ingreso" INTEGER NOT NULL,
    "concepto" VARCHAR(100) NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "cargo_adicional_pkey" PRIMARY KEY ("id_cargo_adicional")
);

-- AddForeignKey
ALTER TABLE "cargo_adicional" ADD CONSTRAINT "cargo_adicional_id_ingreso_fkey" FOREIGN KEY ("id_ingreso") REFERENCES "ingreso"("id_ingreso") ON DELETE CASCADE ON UPDATE CASCADE;

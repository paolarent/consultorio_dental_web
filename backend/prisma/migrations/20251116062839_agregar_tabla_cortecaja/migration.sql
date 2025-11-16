-- CreateTable
CREATE TABLE "corte_caja" (
    "id_corte" SERIAL NOT NULL,
    "fecha_apertura" TIMESTAMP(3) NOT NULL,
    "usuario_apertura" INTEGER NOT NULL,
    "monto_apertura" DECIMAL(10,2) NOT NULL,
    "fecha_cierre" TIMESTAMP(3),
    "usuario_cierre" INTEGER,
    "monto_cierre" DECIMAL(10,2),
    "ingresos_totales" DECIMAL(12,2),
    "pagos_totales" DECIMAL(12,2),
    "diferencia" DECIMAL(12,2),
    "notas" TEXT,

    CONSTRAINT "corte_caja_pkey" PRIMARY KEY ("id_corte")
);

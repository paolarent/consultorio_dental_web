-- CreateEnum
CREATE TYPE "clasificacion_a_cm" AS ENUM ('ninguna', 'alergia', 'condicion_medica');

-- CreateEnum
CREATE TYPE "frecuencia_servicio" AS ENUM ('unica', 'diaria', 'semanal', 'quincenal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual');

-- CreateEnum
CREATE TYPE "proveedor_login" AS ENUM ('local', 'google');

-- CreateEnum
CREATE TYPE "reprog_solicitada_por" AS ENUM ('paciente', 'dentista');

-- CreateEnum
CREATE TYPE "rol" AS ENUM ('paciente', 'dentista');

-- CreateEnum
CREATE TYPE "severidad" AS ENUM ('alta', 'media', 'baja');

-- CreateEnum
CREATE TYPE "sexo" AS ENUM ('femenino', 'masculino', 'otro');

-- CreateEnum
CREATE TYPE "si_o_no" AS ENUM ('si', 'no');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "status_alergia" AS ENUM ('activa', 'resuelta', 'descartada');

-- CreateEnum
CREATE TYPE "status_archivo" AS ENUM ('activo', 'oculto');

-- CreateEnum
CREATE TYPE "status_cita_reprog" AS ENUM ('programada', 'cancelada');

-- CreateEnum
CREATE TYPE "status_citas" AS ENUM ('pendiente', 'programada', 'cancelada', 'completada', 'reprogramada');

-- CreateEnum
CREATE TYPE "status_condicion_med" AS ENUM ('activa', 'resuelta', 'cronica');

-- CreateEnum
CREATE TYPE "status_det_ingreso" AS ENUM ('activo', 'modificado', 'eliminado', 'reembolsado');

-- CreateEnum
CREATE TYPE "status_egreso" AS ENUM ('registrado', 'anulado', 'editado', 'reembolsado');

-- CreateEnum
CREATE TYPE "status_evento" AS ENUM ('activo', 'finalizado', 'cancelado', 'oculto');

-- CreateEnum
CREATE TYPE "status_ingreso" AS ENUM ('pendiente', 'parcial', 'pagado', 'cancelado', 'reembolsado');

-- CreateEnum
CREATE TYPE "status_pag_ingreso" AS ENUM ('confirmado', 'pendiente', 'cancelado', 'reembolsado', 'rechazado');

-- CreateEnum
CREATE TYPE "tipo_cobro" AS ENUM ('unidad_anatomica', 'plan_terapeutico');

-- CreateEnum
CREATE TYPE "tipo_pregunta" AS ENUM ('texto', 'numero', 'fecha', 'seleccion_unica', 'seleccion_multiple', 'si_no');

-- CreateTable
CREATE TABLE "alergia" (
    "id_alergia" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_tipo_alergia" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "severidad" "severidad" NOT NULL,
    "notas" TEXT,
    "status" "status_alergia" NOT NULL,

    CONSTRAINT "alergia_pkey" PRIMARY KEY ("id_alergia")
);

-- CreateTable
CREATE TABLE "archivo" (
    "id_archivo" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "url_imagen" VARCHAR(500) NOT NULL,
    "fecha_subida" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "status_archivo" NOT NULL,

    CONSTRAINT "archivo_pkey" PRIMARY KEY ("id_archivo")
);

-- CreateTable
CREATE TABLE "cita" (
    "id_cita" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_motivo" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIMETZ(6) NOT NULL,
    "frecuencia" "frecuencia_servicio" DEFAULT 'unica',
    "notas" TEXT,
    "id_consultorio" INTEGER NOT NULL,
    "status" "status_citas" NOT NULL,

    CONSTRAINT "cita_pkey" PRIMARY KEY ("id_cita")
);

-- CreateTable
CREATE TABLE "condicion_medica" (
    "id_condicion_medica" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_tipo_condicion" INTEGER NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "año_diagnostico" INTEGER NOT NULL,
    "medicamentos_actuales" TEXT NOT NULL,
    "condicion_controlada" "si_o_no" NOT NULL,
    "status" "status_condicion_med" NOT NULL,

    CONSTRAINT "condicion_medica_pkey" PRIMARY KEY ("id_condicion_medica")
);

-- CreateTable
CREATE TABLE "consultorio" (
    "id_consultorio" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "fecha_registro" DATE NOT NULL,
    "telefono" VARCHAR(10) NOT NULL,
    "correo" VARCHAR(60) NOT NULL,
    "d_calle" VARCHAR(30),
    "d_num_exterior" VARCHAR(5),
    "d_colonia" VARCHAR(30),
    "d_cp" VARCHAR(5),
    "d_entidadfed" VARCHAR(30),
    "d_municipio" VARCHAR(30),
    "d_localidad" VARCHAR(30),
    "titular_ap1" VARCHAR(30) NOT NULL,
    "titular_ap2" VARCHAR(30) NOT NULL,
    "titular_nombre" VARCHAR(50) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "consultorio_pkey" PRIMARY KEY ("id_consultorio")
);

-- CreateTable
CREATE TABLE "detalle_ingreso" (
    "id_detalle_ingreso" SERIAL NOT NULL,
    "id_ingreso" INTEGER NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "status" "status_det_ingreso" NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalle_ingreso_pkey" PRIMARY KEY ("id_detalle_ingreso")
);

-- CreateTable
CREATE TABLE "egreso" (
    "id_egreso" SERIAL NOT NULL,
    "id_tipo_egreso" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "id_consultorio" INTEGER NOT NULL,
    "status" "status_egreso" NOT NULL,

    CONSTRAINT "egreso_pkey" PRIMARY KEY ("id_egreso")
);

-- CreateTable
CREATE TABLE "evento" (
    "id_evento" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "id_tipo_evento" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "evento_todo_el_dia" "si_o_no" NOT NULL,
    "hora_inicio" TIMETZ(6),
    "hora_fin" TIMETZ(6),
    "id_consultorio" INTEGER NOT NULL,
    "notas" TEXT,
    "status" "status_evento" NOT NULL,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "formulario" (
    "id_formulario" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_consultorio" INTEGER NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "formulario_pkey" PRIMARY KEY ("id_formulario")
);

-- CreateTable
CREATE TABLE "fotografia_historial" (
    "id_foto" SERIAL NOT NULL,
    "id_historial" INTEGER NOT NULL,
    "url_fotografia" VARCHAR(500) NOT NULL,
    "fecha_subida" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotografia_historial_pkey" PRIMARY KEY ("id_foto")
);

-- CreateTable
CREATE TABLE "historial_clinico" (
    "id_historial" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_servicio" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "descripcion" TEXT NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "historial_clinico_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "horario" (
    "id_horario" SERIAL NOT NULL,
    "id_consultorio" INTEGER NOT NULL,
    "dia" SMALLINT NOT NULL,
    "hora_inicio" TIMETZ(6) NOT NULL,
    "hora_fin" TIMETZ(6) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "horario_pkey" PRIMARY KEY ("id_horario")
);

-- CreateTable
CREATE TABLE "ingreso" (
    "id_ingreso" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_consultorio" INTEGER NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_DATE,
    "notas" TEXT NOT NULL,
    "status" "status_ingreso" NOT NULL,

    CONSTRAINT "ingreso_pkey" PRIMARY KEY ("id_ingreso")
);

-- CreateTable
CREATE TABLE "metodo_pago" (
    "id_metodo_pago" INTEGER NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "metodo_pago_pkey" PRIMARY KEY ("id_metodo_pago")
);

-- CreateTable
CREATE TABLE "motivo_consulta" (
    "id_motivo" INTEGER NOT NULL,
    "id_consultorio" INTEGER NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',
    "id_servicio" INTEGER,

    CONSTRAINT "motivo_consulta_pkey" PRIMARY KEY ("id_motivo")
);

-- CreateTable
CREATE TABLE "paciente" (
    "id_paciente" SERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "apellido1" VARCHAR(40) NOT NULL,
    "apellido2" VARCHAR(40) NOT NULL,
    "telefono" VARCHAR(10) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "sexo" "sexo" NOT NULL,
    "d_calle" VARCHAR(30),
    "d_num_exterior" VARCHAR(5),
    "d_colonia" VARCHAR(30),
    "d_cp" VARCHAR(5),
    "d_entidadfed" VARCHAR(30),
    "d_municipio" VARCHAR(30),
    "d_localidad" VARCHAR(30),
    "id_usuario" INTEGER NOT NULL,
    "id_consultorio" INTEGER NOT NULL,
    "tiene_tutor" "si_o_no" NOT NULL,
    "tutor_nombre" VARCHAR(60),
    "tutor_apellido1" VARCHAR(40),
    "tutor_apellido2" VARCHAR(40),
    "tutor_telefono" VARCHAR(10),
    "tutor_correo" VARCHAR(60),
    "tutor_relacion" VARCHAR(20),
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "paciente_pkey" PRIMARY KEY ("id_paciente")
);

-- CreateTable
CREATE TABLE "pago_ingreso" (
    "id_pago_ingreso" SERIAL NOT NULL,
    "id_ingreso" INTEGER NOT NULL,
    "id_metodo_pago" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_pago" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referencia" VARCHAR(200) NOT NULL,
    "status" "status_pag_ingreso" NOT NULL,

    CONSTRAINT "pago_ingreso_pkey" PRIMARY KEY ("id_pago_ingreso")
);

-- CreateTable
CREATE TABLE "pregunta" (
    "id_pregunta" SERIAL NOT NULL,
    "id_formulario" INTEGER NOT NULL,
    "texto" VARCHAR NOT NULL,
    "obligatorio" "si_o_no" NOT NULL,
    "id_tipo_clasificacion" INTEGER,
    "tipo" "tipo_pregunta" NOT NULL,
    "id_tipo_alergia" INTEGER,
    "id_tipo_condicion_med" INTEGER,

    CONSTRAINT "pregunta_pkey" PRIMARY KEY ("id_pregunta")
);

-- CreateTable
CREATE TABLE "reprogramacion_cita" (
    "id_reprogramacion" SERIAL NOT NULL,
    "id_cita" INTEGER NOT NULL,
    "solicitada_por" "reprog_solicitada_por" NOT NULL,
    "fecha_original" DATE NOT NULL,
    "hora_original" TIMETZ(6) NOT NULL,
    "nueva_fecha" DATE NOT NULL,
    "nueva_hora" TIMETZ(6) NOT NULL,
    "fecha_solicitud" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_consultorio" INTEGER NOT NULL,
    "status" "status_cita_reprog" NOT NULL,

    CONSTRAINT "reprogramacion_cita_pkey" PRIMARY KEY ("id_reprogramacion")
);

-- CreateTable
CREATE TABLE "respuesta" (
    "id_respuesta" SERIAL NOT NULL,
    "id_paciente" INTEGER NOT NULL,
    "id_pregunta" INTEGER NOT NULL,
    "respuesta" TEXT NOT NULL,
    "fecha_respuesta" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuesta_pkey" PRIMARY KEY ("id_respuesta")
);

-- CreateTable
CREATE TABLE "servicio" (
    "id_servicio" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo_cobro" "tipo_cobro" NOT NULL,
    "precio_base" DECIMAL(10,2) NOT NULL,
    "duracion_base" INTEGER NOT NULL,
    "url_imagen " VARCHAR(255) NOT NULL,
    "id_consultorio" INTEGER NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "servicio_pkey" PRIMARY KEY ("id_servicio")
);

-- CreateTable
CREATE TABLE "tipo_alergia" (
    "id_tipo_alergia" INTEGER NOT NULL,
    "nombre" VARCHAR(40) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "tipo_alergia_pkey" PRIMARY KEY ("id_tipo_alergia")
);

-- CreateTable
CREATE TABLE "tipo_condicion_med" (
    "id_tipo_condicion" INTEGER NOT NULL,
    "nombre" VARCHAR(40) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "tipo_condicion_med_pkey" PRIMARY KEY ("id_tipo_condicion")
);

-- CreateTable
CREATE TABLE "tipo_egreso" (
    "id_tipo_egreso" INTEGER NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "tipo_egreso_pkey" PRIMARY KEY ("id_tipo_egreso")
);

-- CreateTable
CREATE TABLE "tipo_evento" (
    "id_tipo_evento" INTEGER NOT NULL,
    "id_consultorio" INTEGER NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "tipo_evento_pkey" PRIMARY KEY ("id_tipo_evento")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "correo" VARCHAR(60) NOT NULL,
    "contraseña" TEXT NOT NULL,
    "proveedor_login" "proveedor_login" NOT NULL DEFAULT 'local',
    "rol" "rol" NOT NULL,
    "fecha_registro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_recuperacion" VARCHAR(255),
    "expira_token" TIMESTAMPTZ(6),
    "id_consultorio" INTEGER NOT NULL,
    "status" "status" NOT NULL DEFAULT 'activo',

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- AddForeignKey
ALTER TABLE "alergia" ADD CONSTRAINT "id_paciente" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alergia" ADD CONSTRAINT "id_tipo_alergia" FOREIGN KEY ("id_tipo_alergia") REFERENCES "tipo_alergia"("id_tipo_alergia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivo" ADD CONSTRAINT "id_paciente" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "id_motivo" FOREIGN KEY ("id_motivo") REFERENCES "motivo_consulta"("id_motivo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cita" ADD CONSTRAINT "id_paciente" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicion_medica" ADD CONSTRAINT "id_paciente" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "condicion_medica" ADD CONSTRAINT "id_tipo_condicion" FOREIGN KEY ("id_tipo_condicion") REFERENCES "tipo_condicion_med"("id_tipo_condicion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ingreso" ADD CONSTRAINT "id_ingreso" FOREIGN KEY ("id_ingreso") REFERENCES "ingreso"("id_ingreso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ingreso" ADD CONSTRAINT "id_servicio" FOREIGN KEY ("id_servicio") REFERENCES "servicio"("id_servicio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "egreso" ADD CONSTRAINT "id_tipo_egreso" FOREIGN KEY ("id_tipo_egreso") REFERENCES "tipo_egreso"("id_tipo_egreso") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "id_tipo_evento" FOREIGN KEY ("id_tipo_evento") REFERENCES "tipo_evento"("id_tipo_evento") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "formulario" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotografia_historial" ADD CONSTRAINT "id_historial" FOREIGN KEY ("id_historial") REFERENCES "historial_clinico"("id_historial") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_clinico" ADD CONSTRAINT "id_paciente" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_clinico" ADD CONSTRAINT "id_servicio" FOREIGN KEY ("id_servicio") REFERENCES "servicio"("id_servicio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horario" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ingreso" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso" ADD CONSTRAINT "id_paciente" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motivo_consulta" ADD CONSTRAINT "motivo_consulta_id_consultorio_fkey" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paciente" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "paciente" ADD CONSTRAINT "id_usuario" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pago_ingreso" ADD CONSTRAINT "id_ingreso" FOREIGN KEY ("id_ingreso") REFERENCES "ingreso"("id_ingreso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_ingreso" ADD CONSTRAINT "id_metodo_pago" FOREIGN KEY ("id_metodo_pago") REFERENCES "metodo_pago"("id_metodo_pago") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregunta" ADD CONSTRAINT "id_formulario" FOREIGN KEY ("id_formulario") REFERENCES "formulario"("id_formulario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregunta" ADD CONSTRAINT "id_tipo_alergia" FOREIGN KEY ("id_tipo_alergia") REFERENCES "tipo_alergia"("id_tipo_alergia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pregunta" ADD CONSTRAINT "id_tipo_condicion_med" FOREIGN KEY ("id_tipo_condicion_med") REFERENCES "tipo_condicion_med"("id_tipo_condicion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reprogramacion_cita" ADD CONSTRAINT "id_cita" FOREIGN KEY ("id_cita") REFERENCES "cita"("id_cita") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reprogramacion_cita" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuesta" ADD CONSTRAINT "id_paciente" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_paciente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuesta" ADD CONSTRAINT "id_pregunta" FOREIGN KEY ("id_pregunta") REFERENCES "pregunta"("id_pregunta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_evento" ADD CONSTRAINT "tipo_evento_id_consultorio_fkey" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "id_consultorio" FOREIGN KEY ("id_consultorio") REFERENCES "consultorio"("id_consultorio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
CREATE SEQUENCE tipo_evento_id_tipo_evento_seq;
ALTER TABLE "tipo_evento" ALTER COLUMN "id_tipo_evento" SET DEFAULT nextval('tipo_evento_id_tipo_evento_seq');
ALTER SEQUENCE tipo_evento_id_tipo_evento_seq OWNED BY "tipo_evento"."id_tipo_evento";

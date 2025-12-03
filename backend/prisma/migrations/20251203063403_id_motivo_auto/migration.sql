-- AlterTable
CREATE SEQUENCE motivo_consulta_id_motivo_seq;
ALTER TABLE "motivo_consulta" ALTER COLUMN "id_motivo" SET DEFAULT nextval('motivo_consulta_id_motivo_seq');
ALTER SEQUENCE motivo_consulta_id_motivo_seq OWNED BY "motivo_consulta"."id_motivo";

import { FrecuenciaServicio } from "../../../../backend/src/common/enums";

export interface CrearCitaDto {
    id_paciente: number;
    id_servicio: number;
    fecha: string;       // "YYYY-MM-DD"
    hora_inicio: string; // "HH:mm:ss" o "HH:mm"
    frecuencia?: FrecuenciaServicio;
    notas?: string;
}

export interface SolicitarCitaDto {
    id_motivo: number;
    fecha: string;
    hora_inicio: string;
    notas?: string;
}


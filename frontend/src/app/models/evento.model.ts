import { SiONo } from "../../../../backend/src/common/enums";

export interface TipoEvento {
    id_tipo_evento: number;
    nombre: string;
}

export interface Evento {
    id_evento: number;
    titulo: string;
    id_tipo_evento: number;
    fecha_inicio: string;
    fecha_fin: string;
    evento_todo_el_dia: SiONo;
    hora_inicio?: string;
    hora_fin?: string;
    notas?: string;
    tipo_evento: TipoEvento;
}

export interface CreateEventoDto {
    titulo: string;
    id_tipo_evento: number;
    fecha_inicio: string;
    fecha_fin: string;
    evento_todo_el_dia: SiONo;
    hora_inicio?: string;
    hora_fin?: string;
    notas?: string;
}

export interface UpdateEventoDto {
    titulo?: string;
    id_tipo_evento?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    evento_todo_el_dia?: SiONo;
    hora_inicio?: string;
    hora_fin?: string;
    notas?: string;
}




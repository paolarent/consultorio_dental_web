import { SiONo } from "../../../../backend/src/common/enums";

export interface Evento {
    titulo: string;
    id_tipo_evento: number;
    fecha_inicio: string;
    fecha_fin: string;
    evento_todo_el_dia: SiONo;
    hora_inicio?: string;
    hora_fin?: string;
    notas?: string;
}

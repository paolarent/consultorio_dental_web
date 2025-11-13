import { Severidad } from "../../../../backend/src/common/enums";

export interface Alergia {
    id_alergia: number;
    id_tipo_alergia: number;
    nombre: string;
    notas: string;
    severidad: Severidad;
}
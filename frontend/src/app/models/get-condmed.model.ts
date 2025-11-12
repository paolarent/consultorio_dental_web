import { SiONo } from "../../../../backend/src/common/enums";

export interface CondicionMedica {
    id_condicion_medica: number;
    nombre: string;
    a_o_diagnostico: string; 
    medicamentos_actuales: string;
    condicion_controlada: SiONo;
    medicamentos_formateados?: string;
}
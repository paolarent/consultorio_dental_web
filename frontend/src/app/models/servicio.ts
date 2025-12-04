import { TipoCobro } from "../shared/enums";

export interface Servicio {
    id_servicio?: number;
    nombre: string;
    descripcion: string;
    tipo_cobro: TipoCobro.PLAN_TERAPEUTICO | TipoCobro.UNIDAD_ANATOMICA; 
    precio_base: number;
    duracion_base: number;
    url_imagen?: string;
    imagen_public_id?: string;
}

// Extender el modelo Servicio con propiedades formateadas para mostrar
export interface ServicioConFormato extends Servicio {
    precio_base_str: string;
    duracion_base_str: string;
}


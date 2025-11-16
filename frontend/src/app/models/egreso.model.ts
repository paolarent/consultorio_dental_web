export interface CreateEgresoDto {
    monto: number;
    id_tipo_egreso: number;
    fecha: string;
    descripcion: string;
}
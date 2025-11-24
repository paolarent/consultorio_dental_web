export interface AbonarIngresoDto {
    monto: number;
    id_metodo_pago?: number;      // si es un solo pago
    referencia?: string;
    pagosDivididos?: { id_metodo_pago: number; monto: number }[]; // si se divide
}


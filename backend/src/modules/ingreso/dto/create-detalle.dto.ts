import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateDetalleIngresoDto {
    @IsNumber()
    @IsNotEmpty()
    id_servicio: number;

    @IsNumber()
    @IsNotEmpty()
    cantidad: number;

    @IsNumber()
    @IsNotEmpty()
    precio_unitario: number;

    @IsNumber()
    @IsNotEmpty()
    subtotal: number; // cantidad * precio_unitario
}

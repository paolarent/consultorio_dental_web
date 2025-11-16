import { IsNumber, IsOptional, IsString } from "class-validator";

export class AbonarIngresoDto {
    @IsNumber()
    monto: number;

    @IsNumber()
    id_metodo_pago: number;

    @IsString()
    @IsOptional()
    referencia?: string;
}

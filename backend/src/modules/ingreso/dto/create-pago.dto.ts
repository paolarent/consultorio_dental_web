import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { StatusPagIngreso } from 'src/common/enums';

export class CreatePagoIngresoDto {
    @IsNumber()
    monto: number;

    @IsNumber()
    id_metodo_pago: number;

    @IsString()
    @IsOptional()
    referencia?: string;

    @IsEnum(StatusPagIngreso)
    @IsOptional()
    status?: StatusPagIngreso = StatusPagIngreso.CONFIRMADO;
}

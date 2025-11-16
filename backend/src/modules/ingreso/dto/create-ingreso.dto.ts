import { IsNumber, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { StatusIngreso } from 'src/common/enums';
import { CreateDetalleIngresoDto } from './create-detalle.dto';
import { CreatePagoIngresoDto } from './create-pago.dto';

export class CreateIngresoDto {
    @IsNumber()
    @IsNotEmpty()
    id_paciente: number;

    @IsNumber()
    @IsNotEmpty()
    id_consultorio: number;

    @IsString()
    @IsOptional()
    notas?: string;

    @IsEnum(StatusIngreso)
    @IsOptional()
    status?: StatusIngreso = StatusIngreso.PENDIENTE;

    // -------- DETALLES ----------
    @ValidateNested({ each: true })
    @Type(() => CreateDetalleIngresoDto)
    detalles: CreateDetalleIngresoDto[];

    // -------- PAGOS -------------
    @ValidateNested({ each: true })
    @Type(() => CreatePagoIngresoDto)
    pagos: CreatePagoIngresoDto[];
}

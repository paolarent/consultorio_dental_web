import { Type } from 'class-transformer';
import { IsString, IsInt, IsEnum, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { Status, TipoCobro } from 'src/common/enums';

export class CreateServicioDto {
    @IsString()
    @MaxLength(100)
    nombre: string;

    @IsString()
    descripcion: string;

    @IsEnum(TipoCobro)
    tipo_cobro: TipoCobro;

    @IsNumber()
    @Min(0)
    @Type(() => Number)  // convierte string a number
    precio_base: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    duracion_base: number;

    @IsInt()
    @Type(() => Number)
    id_consultorio: number;

    @IsOptional()
    @IsEnum(Status)
    status?: Status;
}

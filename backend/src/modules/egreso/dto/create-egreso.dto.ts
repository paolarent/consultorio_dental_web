import { IsInt, IsDecimal, IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';
import { StatusEgreso } from 'src/common/enums';

export class CreateEgresoDto {
    @IsInt()
    id_tipo_egreso: number;

    @IsDecimal({ decimal_digits: '0,2' })
    monto: string; 

    @IsDateString()
    fecha: string; //formato ISO (YYYY-MM-DD)

    @IsString()
    descripcion: string;

    @IsInt()
    id_consultorio: number;

    //se asigna por defecto el status 'registrado' si no se manda valor
    @IsOptional()
    @IsEnum(StatusEgreso)
    status?: StatusEgreso;
}

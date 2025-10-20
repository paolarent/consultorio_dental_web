import { Type } from 'class-transformer';
import { IsString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Severidad, StatusAlergia } from 'src/common/enums';

export class CreateAlergiaDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    id_paciente?: number; // opcional pq se toma del token si es paciente

    @IsString()
    nombre: string;

    @IsEnum(Severidad)
    severidad: Severidad;

    @IsString()
    notas: string;

    @Type(() => Number)
    @IsInt()
    id_tipo_alergia: number;

    @IsOptional()
    @IsEnum(StatusAlergia)
    status: StatusAlergia;
}

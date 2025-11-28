import { IsInt, IsDateString, IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { FrecuenciaServicio } from 'src/common/enums';

export class CrearCitaDto {
    @IsInt()
    @IsNotEmpty()
    id_paciente: number;

    @IsInt()
    @IsNotEmpty()
    id_servicio: number;

    @IsDateString()
    @IsNotEmpty()
    fecha: string; // formato: "YYYY-MM-DD"

    @IsString()
    @IsNotEmpty()
    hora_inicio: string; // formato: "HH:mm:ss+00:00" o "HH:mm"

    @IsEnum(FrecuenciaServicio)
    @IsOptional()
    frecuencia?: FrecuenciaServicio;

    @IsString()
    @IsOptional()
    notas?: string;
}
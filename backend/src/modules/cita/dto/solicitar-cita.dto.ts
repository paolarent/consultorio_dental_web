import { IsInt, IsDateString, IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class SolicitarCitaDto {
    @IsInt()
    @IsNotEmpty()
    id_motivo: number;

    @IsDateString()
    @IsNotEmpty()
    fecha: string;

    @IsString()
    @IsNotEmpty()
    hora_inicio: string;

    @IsString()
    @IsOptional()
    notas?: string;
}